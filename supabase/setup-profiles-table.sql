-- Create profiles table with expanded fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_school TEXT,
  bio TEXT NOT NULL,
  profile_photo TEXT,
  interests TEXT[],
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  github TEXT,
  instagram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Public can view profiles by username (for public profiles)
CREATE POLICY "Public can view profiles by username"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users cannot delete profiles
CREATE POLICY "Users cannot delete profiles"
  ON public.profiles FOR DELETE
  USING (false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Create function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Username must be 3-20 characters, only letters, numbers, and underscores
  RETURN username ~ '^[a-zA-Z0-9_]{3,20}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to validate username before insert/update
CREATE OR REPLACE FUNCTION public.validate_username_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
CREATE TRIGGER validate_username_before_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username_trigger();

CREATE TRIGGER validate_username_before_update
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username_trigger();