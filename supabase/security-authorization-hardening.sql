-- ============================================
-- VibeLink Security Authorization Hardening
-- ============================================
-- This SQL reproduces the security hardening changes
-- that have been manually applied to the live Supabase project
-- ============================================

-- ============================================
-- 1. CONNECTION_REQUESTS SELF-REQUEST PROTECTION
-- ============================================

-- Add check constraint to prevent users from sending connection requests to themselves
ALTER TABLE public.connection_requests
DROP CONSTRAINT IF EXISTS connection_requests_no_self_request;

ALTER TABLE public.connection_requests
ADD CONSTRAINT connection_requests_no_self_request
CHECK (sender_id <> receiver_id);

-- ============================================
-- 2. CONNECTION_REQUESTS INSERT POLICY
-- ============================================

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert connection requests" ON public.connection_requests;

-- Create secure insert policy
CREATE POLICY "Users can insert connection requests"
ON public.connection_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  sender_id <> receiver_id AND
  status = 'pending'
);

-- ============================================
-- 3. CONNECTION_REQUESTS UPDATE POLICY
-- ============================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update connection requests" ON public.connection_requests;

-- Create secure update policy (receiver only, pending to accepted/declined)
CREATE POLICY "Users can update connection requests"
ON public.connection_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = receiver_id AND
  status = 'pending'
)
WITH CHECK (
  status IN ('accepted', 'declined')
);

-- ============================================
-- 4. LEAST-PRIVILEGE TABLE GRANTS
-- ============================================

-- Revoke existing grants and apply least-privilege model

-- Profiles table
REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- Connection requests table
REVOKE ALL ON TABLE public.connection_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.connection_requests FROM anon;
REVOKE ALL ON TABLE public.connection_requests FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.connection_requests TO authenticated;
GRANT UPDATE(status) ON TABLE public.connection_requests TO authenticated;

-- Connections table
REVOKE ALL ON TABLE public.connections FROM PUBLIC;
REVOKE ALL ON TABLE public.connections FROM anon;
REVOKE ALL ON TABLE public.connections FROM authenticated;
GRANT SELECT, DELETE ON TABLE public.connections TO authenticated;

-- Notifications table
REVOKE ALL ON TABLE public.notifications FROM PUBLIC;
REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.notifications FROM authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE(is_read) ON TABLE public.notifications TO authenticated;

-- ============================================
-- 5. HARDEN public.create_notification(...)
-- ============================================

-- Drop and recreate with security hardening
DROP FUNCTION IF EXISTS public.create_notification(TEXT, UUID, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_type TEXT,
  p_user_id UUID,
  p_related_user_id UUID,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (type, user_id, related_user_id, data, is_read)
  VALUES (p_type, p_user_id, p_related_user_id, p_data, false)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Revoke execution from browser roles
REVOKE EXECUTE ON FUNCTION public.create_notification(TEXT, UUID, UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(TEXT, UUID, UUID, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(TEXT, UUID, UUID, JSONB) FROM authenticated;

-- ============================================
-- 6. HARDEN NOTIFICATION TRIGGER FUNCTIONS
-- ============================================

-- Harden notify_on_request_created()
DROP FUNCTION IF EXISTS public.notify_on_request_created();

CREATE OR REPLACE FUNCTION public.notify_on_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Create notification for receiver when connection request is created
  PERFORM public.create_notification(
    'connection_request',
    NEW.receiver_id,
    NEW.sender_id,
    jsonb_build_object('request_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Revoke execution from browser roles
REVOKE EXECUTE ON FUNCTION public.notify_on_request_created() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_request_created() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_request_created() FROM authenticated;

-- Harden notify_on_request_status_change()
DROP FUNCTION IF EXISTS public.notify_on_request_status_change();

CREATE OR REPLACE FUNCTION public.notify_on_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Create notification for sender when request status changes
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    PERFORM public.create_notification(
      'connection_' || NEW.status,
      NEW.sender_id,
      NEW.receiver_id,
      jsonb_build_object('request_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Revoke execution from browser roles
REVOKE EXECUTE ON FUNCTION public.notify_on_request_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_request_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_request_status_change() FROM authenticated;

-- ============================================
-- 7. REVOKE DIRECT EXECUTION FROM BROWSER ROLES
-- ============================================

-- Revoke execution from internal helper functions
REVOKE EXECUTE ON FUNCTION public.create_connection_on_accept(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_connection_on_accept(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_connection_on_accept(UUID, UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_requests() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_pending_requests() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_connection_requests_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_connection_requests_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_connection_requests_updated_at() FROM authenticated;

-- ============================================
-- 8. DELETE_USER_ACCOUNT() PERMISSIONS
-- ============================================

-- Ensure authenticated can execute, but PUBLIC and anon cannot
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ============================================
-- 9. CONNECTION_EXISTS(UUID, UUID) PERMISSIONS
-- ============================================

-- Ensure authenticated can execute, but PUBLIC and anon cannot
REVOKE EXECUTE ON FUNCTION public.connection_exists(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.connection_exists(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.connection_exists(UUID, UUID) TO authenticated;

-- ============================================
-- 10. GET_CONNECTION_STATUS(UUID, UUID) PERMISSIONS
-- ============================================

-- Ensure authenticated can execute, but PUBLIC and anon cannot
REVOKE EXECUTE ON FUNCTION public.get_connection_status(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_connection_status(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_connection_status(UUID, UUID) TO authenticated;

-- ============================================
-- SECURITY HARDENING COMPLETE
-- ============================================
-- All authorization hardening changes have been reproduced
-- This matches the live Supabase security configuration
