-- ============================================
-- Migration: Extend block notification cleanup
-- ============================================
-- This migration extends the create_block() function to clean up all
-- connection-related notification types when users block each other.
--
-- Scope:
--   - Updates: public.create_block function (CREATE OR REPLACE)
--   - Extends notification cleanup to include connection_accepted and connection_declined
--   - Removes status = 'pending' constraint to clean up all related notifications
--
-- Security:
--   - Preserves all existing authorization checks
--   - Preserves block behavior
--   - Only deletes notifications relevant to the two users involved in the block
-- ============================================

-- ============================================
-- UPDATE create_block RPC
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

  -- Remove all connection-related notifications for both users
  -- This includes connection_request, connection_accepted, and connection_declined
  -- Only removes notifications related to requests between these two users
  DELETE FROM public.notifications
  WHERE user_id IN (auth.uid(), target_user_id)
    AND type IN ('connection_request', 'connection_accepted', 'connection_declined')
    AND related_request_id IN (
      SELECT id FROM public.connection_requests
      WHERE ((sender_id = auth.uid() AND receiver_id = target_user_id)
         OR (sender_id = target_user_id AND receiver_id = auth.uid()))
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

-- Revoke public execute, preserve existing grants
REVOKE EXECUTE ON FUNCTION public.create_block(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_block(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_block(UUID) TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - create_block now cleans up all connection notification types
--   - Notifications are deleted for both users involved in the block
--   - Only notifications related to requests between the two users are deleted
--   - All existing authorization checks preserved
