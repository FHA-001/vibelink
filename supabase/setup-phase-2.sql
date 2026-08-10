-- Phase 2 Database Migration
-- This migration adds connections table, notifications table, and related triggers

-- ============================================
-- CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one_id UUID REFERENCES auth.users(id) NOT NULL,
  user_two_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure users are different
ALTER TABLE public.connections ADD CONSTRAINT connections_different_users 
  CHECK (user_one_id != user_two_id);

-- Create indexes for connections
CREATE INDEX IF NOT EXISTS connections_user_one_idx ON public.connections(user_one_id);
CREATE INDEX IF NOT EXISTS connections_user_two_idx ON public.connections(user_two_id);
CREATE INDEX IF NOT EXISTS connections_users_pair_idx ON public.connections(LEAST(user_one_id, user_two_id), GREATEST(user_one_id, user_two_id));

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections
CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

CREATE POLICY "Users cannot create arbitrary connections"
  ON public.connections FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users cannot modify connections"
  ON public.connections FOR UPDATE
  WITH CHECK (false);

CREATE POLICY "Users can delete own connections"
  ON public.connections FOR DELETE
  USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- Function to check if connection exists between two users
CREATE OR REPLACE FUNCTION public.connection_exists(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_one_id = user_a AND user_two_id = user_b)
       OR (user_one_id = user_b AND user_two_id = user_a)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create connection (called by trigger)
CREATE OR REPLACE FUNCTION public.create_connection_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create connection when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Check if connection already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.connections
      WHERE (user_one_id = NEW.sender_id AND user_two_id = NEW.receiver_id)
         OR (user_one_id = NEW.receiver_id AND user_two_id = NEW.sender_id)
    ) THEN
      -- Create connection with consistent ordering
      INSERT INTO public.connections (user_one_id, user_two_id)
      VALUES (
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger to create connection when request is accepted
DROP TRIGGER IF EXISTS create_connection_trigger ON public.connection_requests;
CREATE TRIGGER create_connection_trigger
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
  EXECUTE FUNCTION public.create_connection_on_accept();

-- Convert existing accepted requests to connections
INSERT INTO public.connections (user_one_id, user_two_id)
SELECT 
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id)
FROM public.connection_requests
WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'connection_declined')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES public.connection_requests(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, is_read);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot create arbitrary notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id AND is_read = false);

CREATE POLICY "Users cannot delete notifications"
  ON public.notifications FOR DELETE
  USING (false);

-- Function to create notification (secure, server-side only)
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  request_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_request_id)
  VALUES (target_user_id, notification_type, notification_title, notification_message, request_id)
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Function to create notification when connection request is created
CREATE OR REPLACE FUNCTION public.notify_on_request_created()
RETURNS TRIGGER AS $$
DECLARE
  requester_username TEXT;
BEGIN
  -- Get requester's username
  SELECT username INTO requester_username
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification for receiver
  PERFORM public.create_notification(
    NEW.receiver_id,
    'connection_request',
    'Someone wants to know more about you',
    '@' || requester_username || ' sent a connection request',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify when request is created
DROP TRIGGER IF EXISTS notify_on_request_created_trigger ON public.connection_requests;
CREATE TRIGGER notify_on_request_created_trigger
  AFTER INSERT ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_request_created();

-- Function to create notification when request status changes
CREATE OR REPLACE FUNCTION public.notify_on_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  receiver_username TEXT;
BEGIN
  -- Only notify when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- Get receiver's username
    SELECT username INTO receiver_username
    FROM public.profiles
    WHERE id = NEW.receiver_id;
    
    IF NEW.status = 'accepted' THEN
      -- Notify sender that request was accepted
      PERFORM public.create_notification(
        NEW.sender_id,
        'connection_accepted',
        'Your VibeLink request was accepted',
        '@' || receiver_username || ' accepted your connection request',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      -- Notify sender that request was declined
      PERFORM public.create_notification(
        NEW.sender_id,
        'connection_declined',
        'Your VibeLink request was declined',
        '@' || receiver_username || ' declined your connection request',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify when request status changes
DROP TRIGGER IF EXISTS notify_on_request_status_change_trigger ON public.connection_requests;
CREATE TRIGGER notify_on_request_status_change_trigger
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status != 'pending')
  EXECUTE FUNCTION public.notify_on_request_status_change();

-- ============================================
-- HELPER FUNCTION TO CHECK CONNECTION STATUS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_connection_status(user_a UUID, user_b UUID)
RETURNS TEXT AS $$
BEGIN
  -- Check if they are connected
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_one_id = user_a AND user_two_id = user_b)
       OR (user_one_id = user_b AND user_two_id = user_a)
  ) THEN
    RETURN 'connected';
  END IF;
  
  -- Check if there's a pending request
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE sender_id = user_a AND receiver_id = user_b AND status = 'pending'
  ) THEN
    RETURN 'pending_sent';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE sender_id = user_b AND receiver_id = user_a AND status = 'pending'
  ) THEN
    RETURN 'pending_received';
  END IF;
  
  -- Check if request was declined
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE sender_id = user_a AND receiver_id = user_b AND status = 'declined'
  ) THEN
    RETURN 'declined';
  END IF;
  
  RETURN 'none';
END;
$$ LANGUAGE plpgsql;
