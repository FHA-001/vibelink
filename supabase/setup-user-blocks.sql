-- ============================================
-- VIBELINK USER BLOCKING SYSTEM
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: auth.users table (must exist)
-- - Creates: public.user_blocks table
-- - Creates: public.create_block RPC
-- - Creates: public.remove_block RPC
-- - Creates: public._check_block_exists RPC (internal)
-- - Creates: public.get_my_block_state RPC
-- - No policy name collisions (new policies)
-- - Function signatures are new (no conflicts)
-- - Grants/revokes are explicit
-- - Compiles against existing auth.users UUID type
-- - No circular dependencies
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on all RPCs
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation in all RPCs
-- - No caller-controlled blocker IDs
-- - EXECUTE revoked from PUBLIC, anon
-- - EXECUTE granted to authenticated only
-- - No block-status disclosure (get_my_block_state only returns whether auth.uid() blocked target)
--
-- Scope:
--   - User-to-user blocking functionality
--   - Database-level enforcement only
--   - No UI in this phase
--
-- Security:
--   - Direct table access revoked from anon/authenticated
--   - All operations through controlled RPCs
--   - Block checks in profile/connection/notification flows
--   - No enumeration of block relationships
-- ============================================

-- ============================================
-- 1. USER BLOCKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT user_blocks_not_self CHECK (blocker_id != blocked_id),
  CONSTRAINT user_blocks_unique_block UNIQUE (blocker_id, blocked_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks(blocked_id);

-- Enable Row Level Security
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Revoke all direct table access from browser roles
REVOKE ALL ON TABLE public.user_blocks FROM PUBLIC, anon, authenticated;

-- No explicit SELECT/INSERT/UPDATE/DELETE policies needed
-- RLS default deny + revoked table privileges prevent direct access
-- All access through controlled SECURITY DEFINER RPCs only

-- ============================================
-- 3. CREATE BLOCK RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.create_block(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Reject NULL target
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID cannot be NULL';
  END IF;

  -- Reject self-block
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Verify target user exists in auth.users (generic error for security)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Unable to complete request';
  END IF;

  -- Idempotent insert using ON CONFLICT
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (auth.uid(), target_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Remove stale connection-request notifications BEFORE deleting requests
  -- This prevents stale actionable state from remaining
  DELETE FROM public.notifications
  WHERE user_id IN (auth.uid(), target_user_id)
    AND type = 'connection_request'
    AND related_request_id IN (
      SELECT id FROM public.connection_requests
      WHERE ((sender_id = auth.uid() AND receiver_id = target_user_id)
         OR (sender_id = target_user_id AND receiver_id = auth.uid()))
        AND status = 'pending'
    );

  -- Remove pending connection requests between the two users in either direction
  -- Only remove pending requests, preserve historical accepted/declined state
  DELETE FROM public.connection_requests
  WHERE ((sender_id = auth.uid() AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = auth.uid()))
    AND status = 'pending';

  -- Remove any existing connection between them in either canonical direction
  DELETE FROM public.connections
  WHERE (user_one_id = auth.uid() AND user_two_id = target_user_id)
     OR (user_one_id = target_user_id AND user_two_id = auth.uid());
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.create_block(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_block(UUID) TO authenticated;

-- ============================================
-- 4. REMOVE BLOCK RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.remove_block(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Reject NULL target
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID cannot be NULL';
  END IF;

  -- Remove block only where blocker is the authenticated user
  DELETE FROM public.user_blocks
  WHERE blocker_id = auth.uid() AND blocked_id = target_user_id;

  -- Do NOT automatically recreate connection, request, or notifications
  -- Users simply become eligible to connect again
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.remove_block(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_block(UUID) TO authenticated;

-- ============================================
-- 5. BLOCK CHECK HELPER (INTERNAL ONLY)
-- ============================================
--
-- This function is for internal use by other RPCs only.
-- It is NOT exposed to authenticated users to prevent enumeration.
--
CREATE OR REPLACE FUNCTION public._check_block_exists(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$;

-- Revoke all execute - internal use only
REVOKE EXECUTE ON FUNCTION public._check_block_exists(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- ============================================
-- 6. GET MY BLOCK STATE RPC (NO DISCLOSURE)
-- ============================================
--
-- This RPC allows the authenticated user to check if they blocked a target.
-- It does NOT reveal whether the target blocked the current user.
--
-- Privacy: Blocked users experience generic "profile not found" behavior.
-- No block-status disclosure through this RPC.
--
CREATE OR REPLACE FUNCTION public.get_my_block_state(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_i_blocked_target BOOLEAN;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Reject NULL target
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID cannot be NULL';
  END IF;

  -- Check only if auth.uid() blocked target_user_id
  -- Do NOT check or return whether target blocked current user
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = auth.uid() AND blocked_id = target_user_id
  ) INTO v_i_blocked_target;

  RETURN v_i_blocked_target;
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_my_block_state(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_block_state(UUID) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - user_blocks table with RLS
--   - Direct table access revoked from browser roles
--   - create_block RPC with side effects
--   - remove_block RPC
--   - Internal block check helper
--
-- Next steps:
--   - Apply profile_reports migration
--   - Update existing RPCs for block awareness
--   - Update account deletion
--   - Create test verification
