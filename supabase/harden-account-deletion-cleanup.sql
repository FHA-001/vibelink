-- ============================================
-- VIBELINK ACCOUNT DELETION CLEANUP
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.notifications table (must exist)
-- - Dependencies: public.connection_requests table (must exist)
-- - Dependencies: public.connections table (must exist)
-- - Dependencies: public.profiles table (must exist)
-- - Dependencies: auth.users table (must exist)
-- - Dependencies: app_private.security_rate_limits table (must exist from rate-limit-hardening.sql)
-- - Dependencies: public.user_blocks table (must exist from setup-user-blocks.sql)
-- - Dependencies: public.profile_reports table (must exist from setup-profile-reports.sql)
-- - Updates: public.delete_user_account RPC (CREATE OR REPLACE preserves security attributes)
-- - No policy name collisions
-- - Function signature unchanged (backward compatible)
-- - Grants/revokes are explicit
-- - Compiles against existing columns/types
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on delete_user_account
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation preserved
-- - EXECUTE revoked from PUBLIC, anon
-- - EXECUTE granted to authenticated only
--
-- Scope:
--   - Update delete_user_account() for comprehensive cleanup
--   - Clean up rate-limit data
--   - Clean up block relationships
--   - Clean up report data
--
-- Security:
--   - No orphaned security data
--   - Clean privacy model for V1
-- ============================================

-- ============================================
-- 1. UPDATE delete_user_account FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Security check: Only allow users to delete their own account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;

  -- Delete rate-limit data for this user
  DELETE FROM app_private.security_rate_limits
  WHERE user_id = auth.uid();

  -- Delete blocks where user is blocker or blocked
  DELETE FROM public.user_blocks
  WHERE blocker_id = auth.uid() OR blocked_id = auth.uid();

  -- Delete reports submitted by this user OR about this user
  -- V1 policy: Delete all reports involving the deleted user
  -- This avoids keeping identity-linked reports for deleted/nonexistent users
  DELETE FROM public.profile_reports
  WHERE reporter_id = auth.uid() OR reported_user_id = auth.uid();

  -- Delete notifications for this user
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();

  -- Delete connection requests where user is sender or receiver
  DELETE FROM public.connection_requests
  WHERE sender_id = auth.uid() OR receiver_id = auth.uid();

  -- Delete connections where user is involved
  DELETE FROM public.connections
  WHERE user_one_id = auth.uid() OR user_two_id = auth.uid();

  -- Delete the user's profile
  DELETE FROM public.profiles
  WHERE id = auth.uid();

  -- Delete the user from auth.users
  DELETE FROM auth.users
  WHERE id = auth.uid();
END;
$$;

-- Revoke public execute, grant to authenticated only (preserve security hardening)
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - Account deletion now cleans up rate-limit data
--   - Account deletion now cleans up block relationships
--   - Account deletion now cleans up report data
--   - Existing deletion behavior preserved
--
-- Note:
--   - Profile photo deletion remains client-side (lib/auth.ts)
--   - ON DELETE CASCADE on user_blocks and profile_reports handles
--     cascading deletion when auth.users is deleted
--   - Explicit cleanup retained for consistency and clarity
--
-- Next steps:
--   - Create test verification
--   - Run build verification
