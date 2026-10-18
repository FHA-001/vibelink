-- ============================================
-- Migration: Make job_title and bio optional in profiles table
-- ============================================
-- This migration simplifies onboarding by making job_title and bio nullable
-- Users can now complete their profile with just username and full_name
-- Existing profiles with job_title and bio are preserved

-- ============================================
-- 1. MAKE job_title AND bio NULLABLE
-- ============================================

-- Drop NOT NULL constraints from job_title and bio columns
ALTER TABLE public.profiles 
ALTER COLUMN job_title DROP NOT NULL,
ALTER COLUMN bio DROP NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL editor
-- 2. Update TypeScript types to reflect nullable fields
-- 3. Update profile completeness checks
-- 4. Update form validations
-- 5. Update UI components to handle null values gracefully
