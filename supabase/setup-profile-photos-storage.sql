-- Phase 4.2: Profile Photos Storage Setup
-- This script sets up Supabase Storage for profile photo uploads

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

-- Create the profile-photos bucket (public bucket for profile images)
-- Note: This needs to be created via Supabase Dashboard or CLI
-- The bucket name must be exactly: profile-photos

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Enable RLS on the bucket
-- Note: This is applied via Supabase Dashboard or CLI

-- Policy: Authenticated users can upload to their own directory
-- Users can only upload to profile-photos/{user_id}/
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can update/replace their own photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can read profile photos (needed for avatar display)
CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- ============================================
-- INSTRUCTIONS FOR MANUAL SETUP
-- ============================================

-- Since Storage buckets cannot be created via SQL in Supabase,
-- you need to create the bucket manually:

-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name it exactly: profile-photos
-- 4. Make it Public (so avatars can be displayed publicly)
-- 5. Click "Create bucket"

-- After creating the bucket, run the RLS policies above
-- via the SQL Editor in Supabase Dashboard.

-- The RLS policies ensure:
-- - Users can only upload to their own user_id directory
-- - Users can only delete their own photos
-- - Public can view all profile photos (needed for avatar display)
