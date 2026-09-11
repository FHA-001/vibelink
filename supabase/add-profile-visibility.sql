-- ============================================
-- STAGE A: NON-BREAKING DATABASE PREPARATION
-- Profile Privacy Model Implementation
-- ============================================
-- This migration adds profile visibility controls without breaking existing functionality
-- The application will continue using direct table access until Stage B

-- ============================================
-- 1. ADD PROFILE_VISIBILITY COLUMN
-- ============================================

-- Add profile_visibility column with approved default visibility
-- Default preserves current stranger-facing UI behavior
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_visibility JSONB NOT NULL DEFAULT 
'{"profile_photo":true,"full_name":false,"job_title":true,"company_school":true,"bio":true,"interests":true,"website":false,"linkedin":false,"twitter":false,"github":false,"instagram":false}'::jsonb;

-- ============================================
-- 2. BACKFILL EXISTING ROWS SAFELY
-- ============================================

-- Update any existing profiles that might have NULL visibility (shouldn't exist with NOT NULL DEFAULT, but safe to run)
UPDATE public.profiles 
SET profile_visibility = '{"profile_photo":true,"full_name":false,"job_title":true,"company_school":true,"bio":true,"interests":true,"website":false,"linkedin":false,"twitter":false,"github":false,"instagram":false}'::jsonb
WHERE profile_visibility IS NULL;

-- ============================================
-- 3. VALIDATION FUNCTIONS
-- ============================================

-- Function to validate visibility configuration structure and values
CREATE OR REPLACE FUNCTION public.validate_profile_visibility_config(visibility JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  allowed_keys TEXT[] := ARRAY['profile_photo','full_name','job_title','company_school','bio','interests','website','linkedin','twitter','github','instagram'];
  key_record TEXT;
BEGIN
  -- Check if visibility is a valid JSONB object
  IF jsonb_typeof(visibility) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each key in the visibility config
  FOR key_record IN SELECT jsonb_object_keys(visibility) 
  LOOP
    -- Verify key is in allowed list
    IF NOT (key_record = ANY(allowed_keys)) THEN
      RETURN FALSE;
    END IF;
    
    -- Verify value is boolean
    IF jsonb_typeof(visibility->key_record) != 'boolean' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to normalize visibility config with safe defaults
-- IMPORTANT: Defaults are on the LEFT so user values win
CREATE OR REPLACE FUNCTION public.normalize_profile_visibility_config(visibility JSONB)
RETURNS JSONB AS $$
DECLARE
  defaults JSONB := '{"profile_photo":true,"full_name":false,"job_title":true,"company_school":true,"bio":true,"interests":true,"website":false,"linkedin":false,"twitter":false,"github":false,"instagram":false}'::jsonb;
BEGIN
  -- Merge defaults with supplied config (supplied values win)
  RETURN defaults || visibility;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to validate and normalize visibility config on insert/update
CREATE OR REPLACE FUNCTION public.enforce_profile_visibility_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate the visibility config structure
  IF NOT public.validate_profile_visibility_config(NEW.profile_visibility) THEN
    RAISE EXCEPTION 'Invalid profile_visibility configuration. Must contain only allowed keys with boolean values.';
  END IF;
  
  -- Normalize to ensure all keys exist with safe defaults
  NEW.profile_visibility := public.normalize_profile_visibility_config(NEW.profile_visibility);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS enforce_profile_visibility_on_insert ON public.profiles;
CREATE TRIGGER enforce_profile_visibility_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_visibility_config();

DROP TRIGGER IF EXISTS enforce_profile_visibility_on_update ON public.profiles;
CREATE TRIGGER enforce_profile_visibility_on_update
  BEFORE UPDATE OF profile_visibility ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_visibility_config();

-- ============================================
-- 4. USERNAME AVAILABILITY RPC FUNCTION
-- ============================================

-- Secure function to check username availability without exposing profile data
CREATE OR REPLACE FUNCTION public.is_username_available(candidate_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  username_exists BOOLEAN;
BEGIN
  -- Check if username already exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE username = candidate_username
  ) INTO username_exists;
  
  RETURN NOT username_exists;
END;
$$;

-- Revoke public execute, grant to anon and authenticated
REVOKE EXECUTE ON FUNCTION public.is_username_available FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available TO anon;
GRANT EXECUTE ON FUNCTION public.is_username_available TO authenticated;

-- ============================================
-- 5. PENDING REQUEST SENDER PREVIEW RPC FUNCTION
-- ============================================

-- Secure function to get minimal sender profile preview for pending requests
-- Only works for the receiver of pending requests, exposes only needed fields
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
REVOKE EXECUTE ON FUNCTION public.get_pending_request_sender_preview FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_request_sender_preview TO authenticated;

-- ============================================
-- 6. SECURE PROFILE VIEW RPC FUNCTION
-- ============================================

-- Secure function to get profile data based on viewer's access level
-- This will be used by the application in Stage B
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
REVOKE EXECUTE ON FUNCTION public.get_profile_for_view FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_for_view TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_for_view TO authenticated;

-- ============================================
-- 7. REVOKE UNNECESSARY TRIGGER FUNCTION EXECUTE
-- ============================================

-- Revoke execute on trigger helper functions (only database should execute them)
REVOKE EXECUTE ON FUNCTION public.validate_profile_visibility_config FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.normalize_profile_visibility_config FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_visibility_config FROM PUBLIC;

-- ============================================
-- 8. EXISTING POLICIES PRESERVED
-- ============================================
-- NOTE: We do NOT remove the existing "Public can view profiles by username" policy yet
-- The application will continue using direct table access until Stage B
-- This ensures no breaking changes during migration

-- Existing policies that remain active:
-- "Users can view own profile" - still needed for owner operations
-- "Public can view profiles by username" - still needed until Stage B
-- "Users can insert own profile" - still needed for profile creation
-- "Users can update own profile" - still needed for profile editing
-- "Users cannot delete profiles" - still needed

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL editor
-- 2. Test the RPC functions manually
-- 3. Proceed to Stage B: Application changes
-- 4. After Stage B is tested and working, apply final RLS policy changes