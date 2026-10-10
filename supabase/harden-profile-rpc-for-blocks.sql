-- ============================================
-- VIBELINK PROFILE RPC BLOCK AWARENESS
-- Phase 5C.2 - Safety Database Layer
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.profiles table (must exist)
-- - Dependencies: public.user_blocks table (must exist from setup-user-blocks.sql)
-- - Updates: public.get_profile_for_view RPC (CREATE OR REPLACE preserves security attributes)
-- - Updates: public.get_pending_request_sender_preview RPC (CREATE OR REPLACE preserves security attributes)
-- - No policy name collisions
-- - Function signatures unchanged (backward compatible)
-- - Grants/revokes are explicit
-- - Compiles against existing columns/types
--
-- SECURITY ATTRIBUTES PRESERVED:
-- - SECURITY DEFINER on both RPCs
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation preserved
-- - EXECUTE grants preserved (anon and authenticated for get_profile_for_view, authenticated only for preview)
--
-- Scope:
--   - Update get_profile_for_view RPC for block awareness
--   - Update get_pending_request_sender_preview RPC for block awareness
--
-- Security:
--   - Blocked users cannot view profiles
--   - Generic "profile not found" behavior
--   - No block enumeration exposure
-- ============================================

-- ============================================
-- 1. UPDATE get_profile_for_view FOR BLOCK AWARENESS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_profile_for_view(target_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_profile profiles%ROWTYPE;
  viewer_id UUID;
  is_owner BOOLEAN;
  is_connected BOOLEAN;
  visibility_config JSONB;
  result JSONB;
BEGIN
  -- Get current viewer's auth ID (null for unauthenticated)
  viewer_id := auth.uid();
  
  -- Get the target profile
  SELECT * INTO target_profile 
  FROM public.profiles 
  WHERE username = target_username;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Determine if viewer is the profile owner
  is_owner := (viewer_id IS NOT NULL AND viewer_id = target_profile.id);
  
  -- Check for block relationship for authenticated non-owner viewers
  IF viewer_id IS NOT NULL AND NOT is_owner THEN
    -- Check if block exists in either direction
    IF EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = viewer_id AND blocked_id = target_profile.id)
         OR (blocker_id = target_profile.id AND blocked_id = viewer_id)
    ) THEN
      -- Block exists - return NULL (profile not found)
      RETURN NULL;
    END IF;
  END IF;
  
  -- Determine if viewer is connected (only if authenticated and not owner)
  IF viewer_id IS NOT NULL AND NOT is_owner THEN
    SELECT EXISTS(
      SELECT 1 FROM public.connections 
      WHERE (user_one_id = viewer_id AND user_two_id = target_profile.id)
         OR (user_one_id = target_profile.id AND user_two_id = viewer_id)
    ) INTO is_connected;
  ELSE
    is_connected := false;
  END IF;
  
  -- Get visibility configuration
  visibility_config := target_profile.profile_visibility;
  
  -- Build result based on access level
  IF is_owner OR is_connected THEN
    -- Full profile for owner or connected users
    result := to_jsonb(target_profile);
    -- Remove internal fields that shouldn't be exposed
    -- Owner gets full profile including updated_at and profile_visibility
    -- Connected users get full profile but without internal fields
    IF is_connected THEN
      result := result - 'updated_at';
      result := result - 'profile_visibility';
    END IF;
  ELSE
    -- Limited profile for strangers based on visibility config
    result := jsonb_build_object(
      'id', target_profile.id, -- ID preserved for connection request flow
      'username', target_profile.username,
      'full_name', CASE WHEN (visibility_config->>'full_name')::boolean = true THEN target_profile.full_name ELSE NULL END,
      'job_title', CASE WHEN (visibility_config->>'job_title')::boolean = true THEN target_profile.job_title ELSE NULL END,
      'company_school', CASE WHEN (visibility_config->>'company_school')::boolean = true THEN target_profile.company_school ELSE NULL END,
      'bio', CASE WHEN (visibility_config->>'bio')::boolean = true THEN target_profile.bio ELSE NULL END,
      'interests', CASE WHEN (visibility_config->>'interests')::boolean = true THEN target_profile.interests ELSE NULL END,
      'website', CASE WHEN (visibility_config->>'website')::boolean = true THEN target_profile.website ELSE NULL END,
      'linkedin', CASE WHEN (visibility_config->>'linkedin')::boolean = true THEN target_profile.linkedin ELSE NULL END,
      'twitter', CASE WHEN (visibility_config->>'twitter')::boolean = true THEN target_profile.twitter ELSE NULL END,
      'github', CASE WHEN (visibility_config->>'github')::boolean = true THEN target_profile.github ELSE NULL END,
      'instagram', CASE WHEN (visibility_config->>'instagram')::boolean = true THEN target_profile.instagram ELSE NULL END,
      'profile_photo', CASE WHEN (visibility_config->>'profile_photo')::boolean = true THEN target_profile.profile_photo ELSE NULL END
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Revoke public execute, grant to anon and authenticated
REVOKE EXECUTE ON FUNCTION public.get_profile_for_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_for_view(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_for_view(text) TO authenticated;

-- ============================================
-- 2. UPDATE get_pending_request_sender_preview FOR BLOCK AWARENESS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pending_request_sender_preview(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  request_data RECORD;
  sender_preview JSONB;
BEGIN
  -- Get the request details
  SELECT sender_id, receiver_id INTO request_data
  FROM public.connection_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Security check: Only the receiver can view their pending requests
  IF auth.uid() IS NULL OR auth.uid() != request_data.receiver_id THEN
    RETURN NULL;
  END IF;
  
  -- Check if block exists in either direction
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = request_data.receiver_id AND blocked_id = request_data.sender_id)
       OR (blocker_id = request_data.sender_id AND blocked_id = request_data.receiver_id)
  ) THEN
    -- Block exists - return NULL
    RETURN NULL;
  END IF;
  
  -- Get minimal sender profile preview (only fields needed for UI)
  SELECT jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'profile_photo', p.profile_photo,
    'bio', p.bio
  ) INTO sender_preview
  FROM public.profiles p
  WHERE p.id = request_data.sender_id;
  
  RETURN sender_preview;
END;
$$;

-- Revoke public execute, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_pending_request_sender_preview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_request_sender_preview(uuid) TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - get_profile_for_view now checks for blocks
--   - get_pending_request_sender_preview now checks for blocks
--   - Blocked users receive NULL (profile not found)
--   - No block enumeration exposure
--
-- Next steps:
--   - Update connection request enforcement
--   - Update notification triggers
--   - Update account deletion
