-- Create connection_requests table
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS connection_requests_sender_id_idx ON public.connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS connection_requests_receiver_id_idx ON public.connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS connection_requests_status_idx ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS connection_requests_sender_receiver_idx ON public.connection_requests(sender_id, receiver_id);

-- Enable Row Level Security
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Authenticated users can create requests where they are the sender
CREATE POLICY "Users can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can view requests where they are either sender or receiver
CREATE POLICY "Users can view own connection requests"
  ON public.connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only the receiver can update the request status
CREATE POLICY "Receivers can update connection request status"
  ON public.connection_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Users cannot delete requests
CREATE POLICY "Users cannot delete connection requests"
  ON public.connection_requests FOR DELETE
  USING (false);

-- Function to prevent duplicate pending requests
CREATE OR REPLACE FUNCTION public.prevent_duplicate_pending_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a pending request already exists between the same sender and receiver
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE sender_id = NEW.sender_id
    AND receiver_id = NEW.receiver_id
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending connection request already exists between these users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicate pending requests
DROP TRIGGER IF EXISTS prevent_duplicate_pending_requests_trigger ON public.connection_requests;
CREATE TRIGGER prevent_duplicate_pending_requests_trigger
  BEFORE INSERT ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_pending_requests();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_connection_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row modification
DROP TRIGGER IF EXISTS update_connection_requests_updated_at_trigger ON public.connection_requests;
CREATE TRIGGER update_connection_requests_updated_at_trigger
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_connection_requests_updated_at();
