-- ============================================
-- VIBELINK CONNECTION REQUEST BLOCK ENFORCEMENT
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.connection_requests table (must exist)
-- - Dependencies: public.user_blocks table (must exist from setup-user-blocks.sql)
-- - Updates: public.prevent_duplicate_pending_requests trigger function (CREATE OR REPLACE)
-- - Recreates: prevent_duplicate_pending_requests_trigger
-- - No policy name collisions
-- - Function signature unchanged (backward compatible)
-- - Grants/revokes are explicit
-- - Compiles against existing columns/types
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on prevent_duplicate_pending_requests
-- - Safe search_path: pg_catalog, public
-- - EXECUTE revoked from PUBLIC, anon, authenticated
-- - Existing duplicate protection preserved
-- - Existing self-request protection preserved
--
-- Scope:
--   - Update connection request INSERT enforcement for block awareness
--   - Prevent connection requests between blocked users
--
-- Security:
--   - Generic error messages (no block enumeration)
--   - Block check in both directions
--   - Preserve existing protections
-- ============================================

-- ============================================
-- 1. UPDATE prevent_duplicate_pending_requests TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_duplicate_pending_requests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Check if a block exists in either direction
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = NEW.sender_id AND blocked_id = NEW.receiver_id)
       OR (blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id)
  ) THEN
    -- Generic error - do not reveal which party blocked whom
    RAISE EXCEPTION 'Unable to send connection request';
  END IF;

  -- Check if a pending request already exists between the same sender and receiver
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE sender_id = NEW.sender_id
    AND receiver_id = NEW.receiver_id
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending connection request already exists between these users';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. RECREATE TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS prevent_duplicate_pending_requests_trigger ON public.connection_requests;
CREATE TRIGGER prevent_duplicate_pending_requests_trigger
  BEFORE INSERT ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_pending_requests();

-- Revoke execution from browser roles (preserve security hardening)
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_requests() FROM PUBLIC, anon, authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - Connection request INSERT now checks for blocks
--   - Generic error message prevents enumeration
--   - Existing duplicate protection preserved
--
-- Next steps:
--   - Update notification triggers
--   - Update account deletion
