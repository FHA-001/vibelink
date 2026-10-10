-- ============================================
-- VIBELINK BLOCKED USERS LISTING
-- Phase 5C-B - Blocked Users Management
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.user_blocks table (must exist from setup-user-blocks.sql)
-- - Dependencies: public.profiles table (must exist)
-- - Creates: public.get_my_blocked_users RPC
-- - No policy name collisions (new function)
-- - Function signature is new (no conflicts)
-- - Grants/revokes are explicit
-- - Compiles against existing column types
--
-- SECURITY ATTRIBUTES:
-- - SECURITY DEFINER
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation
-- - No caller-controlled parameters
-- - EXECUTE revoked from PUBLIC, anon
-- - EXECUTE granted to authenticated only
-- - No reverse block disclosure
-- - No direct SELECT access to user_blocks
--
-- Scope:
--   - Allow users to list users they have blocked
--   - Enable unblock functionality from Settings
--
-- Security:
--   - Only returns users where blocker_id = auth.uid()
--   - Never reveals users who blocked auth.uid()
--   - LEFT JOIN profiles to handle deleted profiles
--   - Minimal data exposure (username only)
-- ============================================

-- ============================================
-- GET MY BLOCKED USERS RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (
  blocked_user_id UUID,
  username TEXT,
  blocked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Return only users that auth.uid() blocked
  -- LEFT JOIN profiles to handle cases where blocked user's profile is deleted
  -- The authoritative row is user_blocks.blocker_id = auth.uid()
  RETURN QUERY
  SELECT
    ub.blocked_id AS blocked_user_id,
    p.username,
    ub.created_at AS blocked_at
  FROM public.user_blocks ub
  LEFT JOIN public.profiles p ON p.id = ub.blocked_id
  WHERE ub.blocker_id = auth.uid()
  ORDER BY ub.created_at DESC;
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - get_my_blocked_users RPC
--   - Authenticated-only execution
--   - Privacy-safe blocked user listing
--
-- Next steps:
--   - Apply migration to Supabase
--   - Add client wrapper in lib/auth.ts
--   - Add Blocked Users section to Settings
