-- Phase 4.5: Account Deletion
-- This script creates a secure function for users to delete their own account

-- ============================================
-- ACCOUNT DELETION FUNCTION
-- ============================================

-- Create function to delete a user's account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only allow users to delete their own account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;

  -- Delete notifications for this user
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();

  -- Delete connection requests where user is sender or receiver
  DELETE FROM public.connection_requests
  WHERE sender_id = auth.uid() OR receiver_id = auth.uid();

  -- Delete connections where user is involved
  DELETE FROM public.connections
  WHERE user_one_id = auth.uid() OR user_two_id = auth.uid();

  -- Delete the user's profile
  DELETE FROM public.profiles
  WHERE id = auth.uid();

  -- Delete the user from auth.users
  DELETE FROM auth.users
  WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ============================================
-- INSTRUCTIONS
-- ============================================

-- This function should be called from the client-side application
-- after the user has confirmed they want to delete their account.
--
-- The function handles:
-- 1. Deleting all notifications
-- 2. Deleting all connection requests (as sender and receiver)
-- 3. Deleting all connections
-- 4. Deleting the profile
-- 5. Deleting the auth user
--
-- IMPORTANT: Profile photos must be deleted via the Storage API
-- BEFORE calling this function, as Storage cannot be deleted via SQL.
--
-- The function uses SECURITY DEFINER to bypass RLS policies for cleanup,
-- but validates that auth.uid() is the user being deleted to prevent
-- unauthorized account deletion.