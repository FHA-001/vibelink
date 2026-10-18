-- ============================================
-- Migration: Allow senders to cancel pending connection requests
-- ============================================
-- This migration replaces the deny-all DELETE policy with a policy that allows
-- the original sender to delete their own pending connection requests.
-- Accepted or declined requests cannot be cancelled.
--
-- Scope:
--   - Drop the existing "Users cannot delete connection requests" policy
--   - Create a new DELETE policy allowing sender to delete pending requests
--
-- Security:
--   - Only the sender (auth.uid() = sender_id) can delete
--   - Only pending requests (status = 'pending') can be deleted
--   - Accepted and declined requests are protected
-- ============================================

-- ============================================
-- 1. DROP EXISTING DELETE POLICIES
-- ============================================

-- Drop the old deny-all DELETE policy (if exists)
DROP POLICY IF EXISTS "Users cannot delete connection requests" ON public.connection_requests;

-- Drop the new sender DELETE policy (if exists, for rerunnability)
DROP POLICY IF EXISTS "Senders can delete their pending connection requests" ON public.connection_requests;

-- ============================================
-- 2. GRANT TABLE-LEVEL DELETE PRIVILEGE
-- ============================================

-- Grant DELETE privilege to authenticated role
-- RLS policy will restrict which rows can actually be deleted
GRANT DELETE ON TABLE public.connection_requests TO authenticated;

-- ============================================
-- 3. CREATE NEW DELETE POLICY FOR SENDERS
-- ============================================

-- Senders can delete their own pending connection requests
CREATE POLICY "Senders can delete their pending connection requests"
  ON public.connection_requests FOR DELETE
  USING (auth.uid() = sender_id AND status = 'pending');

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--   - Senders can now cancel their own pending connection requests
--   - Accepted/declined requests cannot be cancelled
--   - Only the original sender can cancel
--
-- Next steps:
--   - Apply this migration in Supabase SQL editor
--   - Implement cancelConnectionRequest function in lib/auth.ts
--   - Add cancel UI in app/connections/page.tsx
