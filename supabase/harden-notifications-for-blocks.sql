-- ============================================
-- VIBELINK NOTIFICATION BLOCK AWARENESS
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.connection_requests table (must exist)
-- - Dependencies: public.notifications table (must exist)
-- - Dependencies: public.user_blocks table (must exist from setup-user-blocks.sql)
-- - Dependencies: public.create_notification RPC (must exist from security-authorization-hardening.sql)
-- - Updates: public.notify_on_request_created trigger function (CREATE OR REPLACE)
-- - Updates: public.notify_on_request_status_change trigger function (CREATE OR REPLACE)
-- - Recreates: notify_on_request_created_trigger
-- - Recreates: notify_on_request_status_change_trigger
-- - No policy name collisions
-- - Function signatures unchanged (backward compatible)
-- - Grants/revokes are explicit
-- - Compiles against existing columns/types
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on both trigger functions
-- - Safe search_path: pg_catalog, public
-- - EXECUTE revoked from PUBLIC, anon, authenticated
-- - Uses correct create_notification signature from security-authorization-hardening.sql
--
-- Scope:
--   - Update notification triggers for block awareness
--   - Prevent connection-related notifications between blocked users
--
-- Security:
--   - No notifications generated between blocked users
--   - Preserve unrelated notifications
-- ============================================

-- ============================================
-- 1. UPDATE notify_on_request_created TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  requester_username TEXT;
BEGIN
  -- Check if block exists in either direction
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = NEW.sender_id AND blocked_id = NEW.receiver_id)
       OR (blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id)
  ) THEN
    -- Block exists - skip notification
    RETURN NEW;
  END IF;

  -- Get requester's username
  SELECT username INTO requester_username
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Create notification for receiver using live 5-argument signature
  PERFORM public.create_notification(
    NEW.receiver_id,
    'connection_request',
    'Someone wants to know more about you',
    '@' || requester_username || ' sent a connection request',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- ============================================
-- 2. UPDATE notify_on_request_status_change TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  receiver_username TEXT;
BEGIN
  -- Only notify when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- Check if block exists in either direction
    IF EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = NEW.sender_id AND blocked_id = NEW.receiver_id)
         OR (blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id)
    ) THEN
      -- Block exists - skip notification
      RETURN NEW;
    END IF;

    -- Get receiver's username
    SELECT username INTO receiver_username
    FROM public.profiles
    WHERE id = NEW.receiver_id;

    -- Create notification for sender using live 5-argument signature
    IF NEW.status = 'accepted' THEN
      PERFORM public.create_notification(
        NEW.sender_id,
        'connection_accepted',
        'Your VibeLink request was accepted',
        '@' || receiver_username || ' accepted your connection request',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      PERFORM public.create_notification(
        NEW.sender_id,
        'connection_declined',
        'Your VibeLink request was declined',
        '@' || receiver_username || ' declined your connection request',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 3. RECREATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS notify_on_request_created_trigger ON public.connection_requests;
CREATE TRIGGER notify_on_request_created_trigger
  AFTER INSERT ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_request_created();

DROP TRIGGER IF EXISTS notify_on_request_status_change_trigger ON public.connection_requests;
CREATE TRIGGER notify_on_request_status_change_trigger
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status != 'pending')
  EXECUTE FUNCTION public.notify_on_request_status_change();

-- Revoke execution from browser roles (preserve security hardening)
REVOKE EXECUTE ON FUNCTION public.notify_on_request_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_request_status_change() FROM PUBLIC, anon, authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - Connection request notifications check for blocks
--   - Connection status change notifications check for blocks
--   - Unrelated notifications preserved
--
-- Next steps:
--   - Update account deletion
--   - Create test verification
