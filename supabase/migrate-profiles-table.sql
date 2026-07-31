-- Migration script to update existing profiles table
-- This script adds new columns, indexes, and triggers while preserving existing data

-- Add new columns to profiles table (if they don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS company_school TEXT,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Remove ask_me_about column if it exists (no longer needed)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS ask_me_about;

-- Create username index if it doesn't exist
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Drop existing policies to recreate with updated rules
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users cannot delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles by username" ON public.profiles;

-- Create updated policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can view own profile"
        ON public.profiles FOR SELECT
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Public can view profiles by username' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Public can view profiles by username"
        ON public.profiles FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can insert own profile"
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users cannot delete profiles' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users cannot delete profiles"
        ON public.profiles FOR DELETE
        USING (false);
    END IF;
END $$;

-- Create function to validate username format (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.validate_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Username must be 3-20 characters, only letters, numbers, and underscores
  RETURN username ~ '^[a-zA-Z0-9_]{3,20}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.validate_username_vibelink()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_username_before_insert ON public.profiles;
DROP TRIGGER IF EXISTS validate_username_before_update ON public.profiles;

-- Apply the triggers with new function name
CREATE TRIGGER validate_username_before_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username_vibelink();

CREATE TRIGGER validate_username_before_update
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username_vibelink();

-- Update existing profiles to have default username if they don't have one
UPDATE public.profiles 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username = '' OR username IS NULL;

-- Add unique constraint on username (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_username_key'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;