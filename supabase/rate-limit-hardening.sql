-- ============================================
-- VIBELINK CONNECTION REQUEST RATE LIMITING
-- MVP abuse protection
-- ============================================
--
-- Scope:
--   - Connection request creation ONLY
--   - Maximum 10 successful requests per 10-minute window
--   - Per authenticated sender
--
-- Design:
--   - Existing public.connection_requests INSERT flow stays unchanged
--   - Existing RLS, constraints and triggers remain in force
--   - Rate limiting is enforced by a BEFORE INSERT trigger
--   - Rate-limit state lives in app_private
--   - Browser roles cannot access the rate-limit table/functions
--
-- IMPORTANT:
-- This file does NOT alter profile updates, authentication,
-- notifications, connection acceptance, or profile privacy.
-- ============================================


-- ============================================
-- 1. PRIVATE SECURITY SCHEMA
-- ============================================

CREATE SCHEMA IF NOT EXISTS app_private;


-- ============================================
-- 2. PRIVATE RATE LIMIT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS app_private.security_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,

  action_key TEXT NOT NULL,

  window_start TIMESTAMPTZ NOT NULL,

  request_count INTEGER NOT NULL DEFAULT 0,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT security_rate_limits_user_action_unique
    UNIQUE (user_id, action_key),

  CONSTRAINT security_rate_limits_request_count_nonnegative
    CHECK (request_count >= 0)
);


-- The UNIQUE(user_id, action_key) constraint already creates
-- an index suitable for the rate-limit lookup.
-- No redundant user/action index is required.


ALTER TABLE app_private.security_rate_limits
ENABLE ROW LEVEL SECURITY;


-- Make policy creation re-runnable.
DROP POLICY IF EXISTS "No direct access to rate limits"
ON app_private.security_rate_limits;


CREATE POLICY "No direct access to rate limits"
ON app_private.security_rate_limits
FOR ALL
TO PUBLIC
USING (false)
WITH CHECK (false);


-- RLS is defense-in-depth.
-- Browser roles receive no table privileges at all.
REVOKE ALL
ON TABLE app_private.security_rate_limits
FROM PUBLIC, anon, authenticated;


-- ============================================
-- 3. INTERNAL RATE-LIMIT CONSUMER
-- ============================================
--
-- Fixed-window algorithm.
--
-- This function is INTERNAL ONLY.
--
-- Concurrency handling:
--
-- 1. INSERT ... ON CONFLICT DO NOTHING guarantees that a
--    row exists for the user/action combination.
--
-- 2. SELECT ... FOR UPDATE then locks that row.
--
-- 3. Concurrent requests for the same user/action serialize
--    on that row before reading/updating request_count.
--
-- This also safely handles two simultaneous "first" requests.
-- ============================================

CREATE OR REPLACE FUNCTION app_private.consume_rate_limit(
  p_user_id UUID,
  p_action_key TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();

  v_current_count INTEGER;

  v_stored_window_start TIMESTAMPTZ;
BEGIN

  -- ------------------------------------------
  -- Validate internal arguments
  -- ------------------------------------------

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Rate-limit user cannot be NULL';
  END IF;


  IF p_action_key IS NULL
     OR btrim(p_action_key) = '' THEN
    RAISE EXCEPTION 'Rate-limit action cannot be empty';
  END IF;


  IF p_max_requests IS NULL
     OR p_max_requests <= 0 THEN
    RAISE EXCEPTION 'Rate-limit maximum must be greater than zero';
  END IF;


  IF p_window_minutes IS NULL
     OR p_window_minutes <= 0 THEN
    RAISE EXCEPTION 'Rate-limit window must be greater than zero';
  END IF;


  -- ------------------------------------------
  -- Ensure a row exists.
  --
  -- ON CONFLICT handles simultaneous first-use
  -- attempts safely.
  -- ------------------------------------------

  INSERT INTO app_private.security_rate_limits (
    user_id,
    action_key,
    window_start,
    request_count,
    updated_at
  )
  VALUES (
    p_user_id,
    p_action_key,
    v_now,
    0,
    v_now
  )
  ON CONFLICT (user_id, action_key)
  DO NOTHING;


  -- ------------------------------------------
  -- Lock this user's/action's counter.
  -- ------------------------------------------

  SELECT
    srl.request_count,
    srl.window_start
  INTO
    v_current_count,
    v_stored_window_start
  FROM app_private.security_rate_limits AS srl
  WHERE srl.user_id = p_user_id
    AND srl.action_key = p_action_key
  FOR UPDATE;


  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to initialize rate-limit state';
  END IF;


  -- ------------------------------------------
  -- Expired window:
  -- begin a new 10-minute window with count = 1.
  -- ------------------------------------------

  IF v_stored_window_start
       <= v_now - make_interval(mins => p_window_minutes)
  THEN

    UPDATE app_private.security_rate_limits AS srl
    SET
      window_start = v_now,
      request_count = 1,
      updated_at = v_now
    WHERE srl.user_id = p_user_id
      AND srl.action_key = p_action_key;

    RETURN true;

  END IF;


  -- ------------------------------------------
  -- Current window already exhausted.
  -- ------------------------------------------

  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;


  -- ------------------------------------------
  -- Consume one allowance.
  -- ------------------------------------------

  UPDATE app_private.security_rate_limits AS srl
  SET
    request_count = srl.request_count + 1,
    updated_at = v_now
  WHERE srl.user_id = p_user_id
    AND srl.action_key = p_action_key;


  RETURN true;

END;
$$;


-- Internal function must NOT be callable by clients.
REVOKE EXECUTE
ON FUNCTION app_private.consume_rate_limit(
  UUID,
  TEXT,
  INTEGER,
  INTEGER
)
FROM PUBLIC, anon, authenticated;


-- ============================================
-- 4. CONNECTION REQUEST RATE-LIMIT TRIGGER
-- ============================================
--
-- This trigger does NOT replace the existing INSERT policy.
--
-- Existing:
--   - RLS
--   - self-request protection
--   - duplicate protection
--   - status validation
--   - notification triggers
--   - connection logic
--
-- continue operating normally.
--
-- If a later constraint/trigger rejects the INSERT,
-- PostgreSQL rolls back this trigger's rate-limit increment
-- as part of the same transaction.
-- ============================================

CREATE OR REPLACE FUNCTION app_private.enforce_connection_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_authenticated_user UUID;

  v_allowed BOOLEAN;
BEGIN

  v_authenticated_user := auth.uid();


  -- ------------------------------------------
  -- Normal authenticated application request
  -- ------------------------------------------

  IF v_authenticated_user IS NOT NULL THEN

    -- Defense in depth:
    -- the authenticated caller may only create a request
    -- using their own UUID as sender.
    --
    -- Existing RLS should already enforce this, but the
    -- trigger preserves the same security assumption.

    IF NEW.sender_id IS DISTINCT FROM v_authenticated_user THEN
      RAISE EXCEPTION
        'Connection request sender does not match authenticated user';
    END IF;


    -- A new request must begin pending.
    --
    -- Existing constraints/RLS may already enforce this,
    -- but enforcing it here prevents this security trigger
    -- from being used with an unexpected starting state.

    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION
        'New connection requests must have pending status';
    END IF;


    -- Prevent obvious self-request before consuming quota.
    --
    -- Existing database protection remains in place too.

    IF NEW.sender_id = NEW.receiver_id THEN
      RAISE EXCEPTION
        'You cannot send a connection request to yourself';
    END IF;


    -- ----------------------------------------
    -- Consume connection-request allowance.
    --
    -- Maximum:
    -- 10 successful INSERT attempts per
    -- fixed 10-minute window.
    -- ----------------------------------------

    v_allowed :=
      app_private.consume_rate_limit(
        v_authenticated_user,
        'connection_request',
        10,
        10
      );


    IF NOT v_allowed THEN
      RAISE EXCEPTION
        'Too many connection requests. Please try again later.';
    END IF;

  END IF;


  -- ------------------------------------------
  -- Why auth.uid() NULL is not rejected here:
  --
  -- Normal anon/browser inserts remain blocked by the
  -- existing connection_requests RLS policy.
  --
  -- A privileged backend/service-role operation is therefore
  -- not accidentally broken by this rate-limit trigger.
  -- ------------------------------------------


  RETURN NEW;

END;
$$;


-- Browser roles must not directly execute the trigger function.
REVOKE EXECUTE
ON FUNCTION app_private.enforce_connection_request_rate_limit()
FROM PUBLIC, anon, authenticated;


-- ============================================
-- 5. INSTALL RATE-LIMIT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS connection_request_rate_limit_trigger
ON public.connection_requests;


CREATE TRIGGER connection_request_rate_limit_trigger
BEFORE INSERT
ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION app_private.enforce_connection_request_rate_limit();


-- ============================================
-- MIGRATION COMPLETE
-- ============================================
--
-- Result:
--
-- authenticated user
--       |
--       v
-- existing INSERT into public.connection_requests
--       |
--       +--> existing RLS / policies
--       |
--       +--> BEFORE INSERT rate-limit trigger
--       |        |
--       |        +--> private consume_rate_limit()
--       |
--       +--> existing constraints / duplicate protection
--       |
--       +--> existing notification trigger(s)
--
--
-- No browser-callable rate-limit RPC is created.
--
-- Existing application architecture remains intact.
--
-- Rate limit:
--   10 connection requests / 10 minutes / authenticated sender
--
-- Failed INSERT statements roll back any counter update because
-- the trigger and INSERT execute in the same transaction.
-- ============================================