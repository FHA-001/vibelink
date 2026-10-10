-- ============================================
-- VIBELINK PROFILE REPORTING SYSTEM
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: auth.users table (must exist)
-- - Dependencies: app_private.security_rate_limits table (must exist from rate-limit-hardening.sql)
-- - Dependencies: app_private.consume_rate_limit function (must exist from rate-limit-hardening.sql)
-- - Creates: public.profile_reports table
-- - Creates: public.create_profile_report RPC
-- - No policy name collisions (new policies)
-- - Function signatures are new (no conflicts)
-- - Grants/revokes are explicit
-- - Compiles against existing auth.users UUID type
-- - Uses verified consume_rate_limit signature: (UUID, TEXT, INTEGER, INTEGER) where last param is minutes
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on create_profile_report RPC
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation in RPC
-- - No caller-controlled reporter IDs
-- - EXECUTE revoked from PUBLIC, anon
-- - EXECUTE granted to authenticated only
--
-- Scope:
--   - Profile reporting functionality
--   - Database-level enforcement only
--   - No UI in this phase
--   - No admin dashboard in V1
--
-- Security:
--   - Direct table access revoked from anon/authenticated
--   - Reports submitted only through controlled RPC
--   - Manual moderation via Supabase dashboard
--   - No enumeration of reporter identity
-- ============================================

-- ============================================
-- 1. PROFILE REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT profile_reports_not_self CHECK (reporter_id != reported_user_id),
  CONSTRAINT profile_reports_valid_reason CHECK (reason IN ('impersonation', 'spam', 'harassment', 'inappropriate_content', 'other')),
  CONSTRAINT profile_reports_valid_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  CONSTRAINT profile_reports_other_requires_details CHECK (
    (reason != 'other') OR (reason = 'other' AND details IS NOT NULL AND btrim(details) != '')
  ),
  CONSTRAINT profile_reports_details_length CHECK (
    details IS NULL OR length(details) <= 2000
  )
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS profile_reports_reporter_idx ON public.profile_reports(reporter_id);
CREATE INDEX IF NOT EXISTS profile_reports_reported_idx ON public.profile_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS profile_reports_status_idx ON public.profile_reports(status);

-- Enable Row Level Security
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Revoke all direct table access from browser roles
REVOKE ALL ON TABLE public.profile_reports FROM PUBLIC, anon, authenticated;

-- Users cannot directly SELECT reports
CREATE POLICY "Users cannot directly select reports"
  ON public.profile_reports FOR SELECT
  USING (false);

-- No explicit INSERT/UPDATE/DELETE policies needed
-- RLS default deny + revoked table privileges prevent direct access

-- Anonymous users have no access
CREATE POLICY "Anonymous users cannot access reports"
  ON public.profile_reports FOR ALL
  TO anon
  USING (false);

-- ============================================
-- 3. CREATE PROFILE REPORT RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.create_profile_report(
  target_user_id UUID,
  report_reason TEXT,
  report_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_report_id UUID;
  v_allowed BOOLEAN;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Reject NULL target
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID cannot be NULL';
  END IF;

  -- Reject self-reporting
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot report yourself';
  END IF;

  -- Verify target user exists in auth.users (generic error for security)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Unable to complete request';
  END IF;

  -- Validate reason
  IF report_reason IS NULL OR report_reason NOT IN ('impersonation', 'spam', 'harassment', 'inappropriate_content', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason';
  END IF;

  -- Require details for 'other' reason
  IF report_reason = 'other' AND (report_details IS NULL OR btrim(report_details) = '') THEN
    RAISE EXCEPTION 'Details required for "other" reason';
  END IF;

  -- Trim details if provided
  IF report_details IS NOT NULL THEN
    report_details := btrim(report_details);
  END IF;

  -- Enforce details length limit (2000 characters)
  IF report_details IS NOT NULL AND length(report_details) > 2000 THEN
    RAISE EXCEPTION 'Details must be 2000 characters or less';
  END IF;

  -- Enforce report rate limit: 5 reports per hour per authenticated user
  -- Reuse existing app_private.security_rate_limits infrastructure
  -- Signature: consume_rate_limit(p_user_id UUID, p_action_key TEXT, p_max_requests INTEGER, p_window_minutes INTEGER)
  v_allowed := app_private.consume_rate_limit(
    auth.uid(),
    'profile_report',
    5,
    60  -- 60 minutes = 1 hour
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Too many reports submitted. Please try again later.';
  END IF;

  -- Insert the report
  INSERT INTO public.profile_reports (reporter_id, reported_user_id, reason, details, status)
  VALUES (auth.uid(), target_user_id, report_reason, report_details, 'pending')
  RETURNING id INTO new_report_id;

  RETURN new_report_id;
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.create_profile_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_profile_report(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - profile_reports table with RLS
--   - Direct table access revoked from browser roles
--   - create_profile_report RPC with rate limiting
--   - Details length validation (2000 characters)
--   - 'other' reason requires details
--   - Status changes require service role access
--
-- Next steps:
--   - Update existing RPCs for block awareness
--   - Update account deletion
--   - Create test verification
