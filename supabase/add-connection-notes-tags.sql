-- ============================================
-- VIBELINK CONNECTION NOTES AND TAGS
-- Phase 5E-C - Private Connection Management
-- ============================================
--
-- MIGRATION SAFETY CHECKS:
-- - Dependencies: public.connections table (must exist from setup-phase-2.sql)
-- - Dependencies: auth.users table (must exist)
-- - Creates: public.connection_notes table
-- - Creates: public.connection_tags table
-- - Creates: public.connection_tag_assignments table
-- - Creates: RPCs for notes and tags CRUD
-- - No policy name collisions (new policies)
-- - Function signatures are new (no conflicts)
-- - Grants/revokes are explicit
-- - Compiles against existing columns/types
--
-- SECURITY ATTRIBUTES:
-- - SECURITY DEFINER on all RPCs
-- - Safe search_path: pg_catalog, public
-- - auth.uid() validation in all RPCs
-- - RLS on all tables with user_id = auth.uid()
-- - Direct table access revoked from anon/authenticated
-- - ON DELETE CASCADE for lifecycle cleanup
--
-- Scope:
--   - Private connection notes (one per connection per user)
--   - Personal tag definitions (per user)
--   - Tag assignments to connections (per user)
--   - CRUD operations through RPCs only
--
-- Security:
--   - Notes and tags are user-private
--   - Never exposed in public-profile RPCs or connection previews
--   - Connection removal cascades to notes and assignments
--   - Account deletion cascades through auth.users
-- ============================================

-- ============================================
-- 1. CONNECTION NOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.connection_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT connection_notes_unique UNIQUE (user_id, connection_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS connection_notes_user_connection_idx ON public.connection_notes(user_id, connection_id);

-- Enable Row Level Security
ALTER TABLE public.connection_notes ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access from browser roles
REVOKE ALL ON TABLE public.connection_notes FROM PUBLIC, anon, authenticated;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'connection_notes'
      AND policyname = 'Users can manage own connection notes'
  ) THEN
    CREATE POLICY "Users can manage own connection notes"
      ON public.connection_notes FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_connection_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Trigger to update updated_at on row modification
DROP TRIGGER IF EXISTS update_connection_notes_updated_at_trigger ON public.connection_notes;
CREATE TRIGGER update_connection_notes_updated_at_trigger
  BEFORE UPDATE ON public.connection_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_connection_notes_updated_at();

-- ============================================
-- 2. CONNECTION TAGS TABLE (User's Personal Tags)
-- ============================================

CREATE TABLE IF NOT EXISTS public.connection_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,

  CONSTRAINT connection_tags_unique UNIQUE (user_id, tag_name)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS connection_tags_user_name_idx ON public.connection_tags(user_id, tag_name);

-- Add unique constraint for composite foreign key reference
-- This ensures (user_id, id) is unique, allowing assignments to reference it
DO $$
DECLARE
  v_table_oid OID;
BEGIN
  SELECT oid INTO v_table_oid
  FROM pg_class
  WHERE relname = 'connection_tags'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'connection_tags_user_id_id_unique'
      AND conrelid = v_table_oid
  ) THEN
    ALTER TABLE public.connection_tags
    ADD CONSTRAINT connection_tags_user_id_id_unique UNIQUE (user_id, id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.connection_tags ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access from browser roles
REVOKE ALL ON TABLE public.connection_tags FROM PUBLIC, anon, authenticated;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'connection_tags'
      AND policyname = 'Users can manage own connection tags'
  ) THEN
    CREATE POLICY "Users can manage own connection tags"
      ON public.connection_tags FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 3. CONNECTION TAG ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.connection_tag_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.connection_tags(id) ON DELETE CASCADE,

  CONSTRAINT connection_tag_assignments_unique UNIQUE (user_id, connection_id, tag_id)
);

-- Add composite foreign key to enforce tag ownership at database level
-- This ensures tag_id belongs to the same user_id in the assignment
DO $$
DECLARE
  v_table_oid OID;
BEGIN
  SELECT oid INTO v_table_oid
  FROM pg_class
  WHERE relname = 'connection_tag_assignments'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'connection_tag_assignments_tag_ownership'
      AND conrelid = v_table_oid
  ) THEN
    ALTER TABLE public.connection_tag_assignments
    ADD CONSTRAINT connection_tag_assignments_tag_ownership
    FOREIGN KEY (user_id, tag_id)
    REFERENCES public.connection_tags(user_id, id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS connection_tag_assignments_user_connection_idx ON public.connection_tag_assignments(user_id, connection_id);
CREATE INDEX IF NOT EXISTS connection_tag_assignments_user_tag_idx ON public.connection_tag_assignments(user_id, tag_id);

-- Enable Row Level Security
ALTER TABLE public.connection_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Revoke all direct table access from browser roles
REVOKE ALL ON TABLE public.connection_tag_assignments FROM PUBLIC, anon, authenticated;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'connection_tag_assignments'
      AND policyname = 'Users can manage own tag assignments'
  ) THEN
    CREATE POLICY "Users can manage own tag assignments"
      ON public.connection_tag_assignments FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 4. RPC: UPSERT CONNECTION NOTE
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_connection_note(
  p_connection_id UUID,
  p_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_note_id UUID;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate inputs
  IF p_connection_id IS NULL THEN
    RAISE EXCEPTION 'Connection ID cannot be NULL';
  END IF;

  IF p_note IS NULL OR TRIM(p_note) = '' THEN
    RAISE EXCEPTION 'Note cannot be empty';
  END IF;

  -- Verify connection exists and user is part of it
  IF NOT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = p_connection_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Connection not found or access denied';
  END IF;

  -- Upsert note
  INSERT INTO public.connection_notes (user_id, connection_id, note)
  VALUES (auth.uid(), p_connection_id, TRIM(p_note))
  ON CONFLICT (user_id, connection_id)
  DO UPDATE SET note = TRIM(p_note)
  RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_connection_note(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_connection_note(UUID, TEXT) TO authenticated;

-- ============================================
-- 5. RPC: DELETE CONNECTION NOTE
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_connection_note(
  p_connection_id UUID
)
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

  -- Validate input
  IF p_connection_id IS NULL THEN
    RAISE EXCEPTION 'Connection ID cannot be NULL';
  END IF;

  -- Delete note (RLS ensures only user's own notes)
  DELETE FROM public.connection_notes
  WHERE user_id = auth.uid() AND connection_id = p_connection_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_connection_note(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_connection_note(UUID) TO authenticated;

-- ============================================
-- 6. RPC: CREATE CONNECTION TAG
-- ============================================

CREATE OR REPLACE FUNCTION public.create_connection_tag(
  p_tag_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate input
  IF p_tag_name IS NULL OR TRIM(p_tag_name) = '' THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;

  -- Create tag (ON CONFLICT returns existing tag)
  INSERT INTO public.connection_tags (user_id, tag_name)
  VALUES (auth.uid(), TRIM(p_tag_name))
  ON CONFLICT (user_id, tag_name)
  DO NOTHING
  RETURNING id INTO v_tag_id;

  -- If tag already existed, fetch its ID
  IF v_tag_id IS NULL THEN
    SELECT id INTO v_tag_id
    FROM public.connection_tags
    WHERE user_id = auth.uid() AND tag_name = TRIM(p_tag_name);
  END IF;

  RETURN v_tag_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_connection_tag(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_connection_tag(TEXT) TO authenticated;

-- ============================================
-- 7. RPC: DELETE CONNECTION TAG
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_connection_tag(
  p_tag_id UUID
)
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

  -- Validate input
  IF p_tag_id IS NULL THEN
    RAISE EXCEPTION 'Tag ID cannot be NULL';
  END IF;

  -- Delete tag (RLS ensures only user's own tags)
  DELETE FROM public.connection_tags
  WHERE user_id = auth.uid() AND id = p_tag_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_connection_tag(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_connection_tag(UUID) TO authenticated;

-- ============================================
-- 8. RPC: ASSIGN TAG TO CONNECTION
-- ============================================

CREATE OR REPLACE FUNCTION public.assign_tag_to_connection(
  p_connection_id UUID,
  p_tag_id UUID
)
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

  -- Validate inputs
  IF p_connection_id IS NULL THEN
    RAISE EXCEPTION 'Connection ID cannot be NULL';
  END IF;

  IF p_tag_id IS NULL THEN
    RAISE EXCEPTION 'Tag ID cannot be NULL';
  END IF;

  -- Verify connection exists and user is part of it
  IF NOT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = p_connection_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Connection not found or access denied';
  END IF;

  -- Verify tag belongs to user (RLS handles this, but explicit check for clarity)
  IF NOT EXISTS (
    SELECT 1 FROM public.connection_tags
    WHERE id = p_tag_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Tag not found or access denied';
  END IF;

  -- Assign tag (ON CONFLICT prevents duplicates)
  INSERT INTO public.connection_tag_assignments (user_id, connection_id, tag_id)
  VALUES (auth.uid(), p_connection_id, p_tag_id)
  ON CONFLICT (user_id, connection_id, tag_id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_tag_to_connection(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_tag_to_connection(UUID, UUID) TO authenticated;

-- ============================================
-- 9. RPC: REMOVE TAG FROM CONNECTION
-- ============================================

CREATE OR REPLACE FUNCTION public.remove_tag_from_connection(
  p_connection_id UUID,
  p_tag_id UUID
)
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

  -- Validate inputs
  IF p_connection_id IS NULL THEN
    RAISE EXCEPTION 'Connection ID cannot be NULL';
  END IF;

  IF p_tag_id IS NULL THEN
    RAISE EXCEPTION 'Tag ID cannot be NULL';
  END IF;

  -- Remove assignment (RLS ensures only user's own assignments)
  DELETE FROM public.connection_tag_assignments
  WHERE user_id = auth.uid()
    AND connection_id = p_connection_id
    AND tag_id = p_tag_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.remove_tag_from_connection(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_tag_from_connection(UUID, UUID) TO authenticated;

-- ============================================
-- 10. RPC: GET CONNECTION NOTES AND TAGS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_connection_notes_and_tags(p_connection_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result JSONB;
  v_note TEXT;
  v_tags JSONB;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate input
  IF p_connection_id IS NULL THEN
    RAISE EXCEPTION 'Connection ID cannot be NULL';
  END IF;

  -- Verify connection exists and user is part of it
  IF NOT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = p_connection_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Connection not found or access denied';
  END IF;

  -- Get note
  SELECT note INTO v_note
  FROM public.connection_notes
  WHERE user_id = auth.uid() AND connection_id = p_connection_id;

  -- Get tags
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ct.id,
    'tag_name', ct.tag_name
  )), '[]'::jsonb) INTO v_tags
  FROM public.connection_tag_assignments cta
  JOIN public.connection_tags ct ON cta.tag_id = ct.id
  WHERE cta.user_id = auth.uid() AND cta.connection_id = p_connection_id;

  -- Build result
  v_result := jsonb_build_object(
    'note', v_note,
    'tags', v_tags
  );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_connection_notes_and_tags(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_connection_notes_and_tags(UUID) TO authenticated;

-- ============================================
-- 11. RPC: GET ALL USER TAGS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tags()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Return all user's tags, or empty array if none
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object('id', id, 'tag_name', tag_name)
      )
      FROM public.connection_tags
      WHERE user_id = auth.uid()
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_tags() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tags() TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - connection_notes table with RLS and cascade delete
--   - connection_tags table with RLS and cascade delete
--   - connection_tag_assignments table with RLS and cascade delete
--   - RPCs for notes CRUD (upsert, delete, get)
--   - RPCs for tags CRUD (create, delete, get all)
--   - RPCs for tag assignments (assign, remove)
--   - RPC for getting notes and tags for a connection
--
-- Lifecycle behavior:
--   - Connection removal cascades to notes and assignments via ON DELETE CASCADE
--   - Account deletion cascades via auth.users ON DELETE CASCADE
--   - Blocking already deletes connections, which cascades to notes/assignments
--
-- Security:
--   - All tables have RLS with user_id = auth.uid()
--   - Direct table access revoked from anon/authenticated
--   - All operations through SECURITY DEFINER RPCs
--   - Notes/tags never exposed in public-profile RPCs
--
-- Manual migration steps:
--   - This migration is NOT applied to production
--   - Requires manual review and approval before application
--   - Run: `supabase db push migration add-connection-notes-tags.sql`
--   - Or apply via Supabase dashboard SQL editor
