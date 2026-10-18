-- ============================================
-- Migration: Add receiver preview RPC for sent requests
-- ============================================
-- This migration adds a new RPC function to allow the sender of a pending
-- connection request to view the receiver's profile preview.
--
-- Scope:
--   - Create get_pending_request_receiver_preview RPC function
--   - Grant EXECUTE to authenticated role only
--
-- Security:
--   - Only the sender can view their pending request's receiver profile
--   - Exposes only minimal profile fields needed for UI
--   - Returns NULL if request not found, not pending, or user is not sender
--   - Block-aware: returns NULL if blocked
-- ============================================

-- ============================================
-- 1. CREATE RECEIVER PREVIEW RPC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pending_request_receiver_preview(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  request_data RECORD;
  receiver_preview JSONB;
BEGIN
  -- Get the request details
  SELECT sender_id, receiver_id INTO request_data
  FROM public.connection_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Security check: Only the sender can view their pending request's receiver profile
  IF auth.uid() IS NULL OR auth.uid() != request_data.sender_id THEN
    RETURN NULL;
  END IF;

  -- Check if a block exists in either direction
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = request_data.sender_id AND blocked_id = request_data.receiver_id)
       OR (blocker_id = request_data.receiver_id AND blocked_id = request_data.sender_id)
  ) THEN
    -- Return NULL if blocked (no profile visibility)
    RETURN NULL;
  END IF;

  -- Get minimal receiver profile preview (only fields needed for UI)
  SELECT jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'profile_photo', p.profile_photo,
    'bio', p.bio
  ) INTO receiver_preview
  FROM public.profiles p
  WHERE p.id = request_data.receiver_id;

  RETURN receiver_preview;
END;
$$;

-- ============================================
-- 2. GRANT EXECUTE PERMISSIONS
-- ============================================

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_pending_request_receiver_preview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_request_receiver_preview(uuid) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - Senders can now view receiver profile preview for their pending requests
--   - Only minimal fields exposed (id, username, full_name, profile_photo, bio)
--   - Block-aware: blocked users receive NULL
--   - Security check ensures only sender can view
--
-- Next steps:
--   - Update lib/auth.ts getSentRequests() to use this new RPC
--   - Update app/connections/page.tsx to use receiver_profile field
