begin;

-- Each person's switch. Off by default: no row means the form is off.
create table if not exists public.profile_message_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accepts_messages boolean not null default false,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Messages left by visitors without an account. No direct table access.
create table if not exists public.visitor_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  sender_contact text not null check (char_length(sender_contact) between 5 and 120),
  message text not null check (char_length(message) between 2 and 1000),
  created_at timestamptz not null default timezone('utc'::text, now()),
  read_at timestamptz
);

create index if not exists visitor_messages_recipient_idx
  on public.visitor_messages (recipient_id, created_at desc);
create index if not exists visitor_messages_created_idx
  on public.visitor_messages (created_at);

alter table public.profile_message_settings enable row level security;
alter table public.visitor_messages enable row level security;
revoke all on public.profile_message_settings from anon, authenticated;
revoke all on public.visitor_messages from anon, authenticated;

-- Public: does this profile accept messages? Returns only true or false.
create or replace function public.get_message_form_status(p_username text)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $$
  select coalesce((
    select s.accepts_messages
    from public.profiles p
    join public.profile_message_settings s on s.user_id = p.id
    where p.username = lower(trim(p_username))
  ), false);
$$;

-- Server only: saves a message. Called by our API route after Turnstile passes.
create or replace function public.submit_visitor_message(
  p_username text,
  p_name text,
  p_contact text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_recipient uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_contact text := trim(coalesce(p_contact, ''));
  v_message text := trim(coalesce(p_message, ''));
begin
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Please enter your name';
  end if;
  if char_length(v_contact) < 5 or char_length(v_contact) > 120 then
    raise exception 'Please enter an email or phone number';
  end if;
  if char_length(v_message) < 2 or char_length(v_message) > 1000 then
    raise exception 'Please write a short message';
  end if;

  select p.id into v_recipient
  from public.profiles p
  join public.profile_message_settings s on s.user_id = p.id
  where p.username = lower(trim(coalesce(p_username, '')))
    and s.accepts_messages = true;

  if v_recipient is null then
    raise exception 'Unable to send message';
  end if;

  -- Keep retention: remove messages older than 90 days
  delete from public.visitor_messages
  where created_at < now() - interval '90 days';

  -- At most 20 messages per recipient per day
  if (
    select count(*) from public.visitor_messages
    where recipient_id = v_recipient
      and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'Too many messages today. Please try again tomorrow.';
  end if;

  -- At most 3 messages per sender contact per day, across all profiles
  if (
    select count(*) from public.visitor_messages
    where lower(sender_contact) = lower(v_contact)
      and created_at > now() - interval '1 day'
  ) >= 3 then
    raise exception 'Too many messages today. Please try again tomorrow.';
  end if;

  insert into public.visitor_messages (recipient_id, sender_name, sender_contact, message)
  values (v_recipient, v_name, v_contact, v_message);
end;
$$;

create or replace function public.get_my_message_settings()
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  return coalesce((
    select accepts_messages from public.profile_message_settings where user_id = auth.uid()
  ), false);
end;
$$;

create or replace function public.set_accepts_messages(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Complete your profile first';
  end if;

  insert into public.profile_message_settings (user_id, accepts_messages)
  values (auth.uid(), coalesce(p_enabled, false))
  on conflict (user_id)
  do update set accepts_messages = coalesce(p_enabled, false),
                updated_at = timezone('utc'::text, now());
end;
$$;

create or replace function public.get_my_visitor_messages()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'sender_name', m.sender_name,
        'sender_contact', m.sender_contact,
        'message', m.message,
        'created_at', m.created_at,
        'read_at', m.read_at
      )
      order by m.created_at desc
    )
    from (
      select * from public.visitor_messages
      where recipient_id = auth.uid()
        and created_at > now() - interval '90 days'
      order by created_at desc
      limit 100
    ) m
  ), '[]'::jsonb);
end;
$$;

create or replace function public.mark_visitor_message_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  update public.visitor_messages
  set read_at = coalesce(read_at, now())
  where id = p_id and recipient_id = auth.uid();
end;
$$;

create or replace function public.delete_visitor_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  delete from public.visitor_messages
  where id = p_id and recipient_id = auth.uid();
end;
$$;

-- Public: only the true/false switch status
revoke all on function public.get_message_form_status(text) from public;
grant execute on function public.get_message_form_status(text) to anon, authenticated;

-- Server only: nobody else can save a message
revoke all on function public.submit_visitor_message(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_visitor_message(text, text, text, text) to service_role;

-- Signed-in owners only
revoke all on function public.get_my_message_settings() from public, anon;
revoke all on function public.set_accepts_messages(boolean) from public, anon;
revoke all on function public.get_my_visitor_messages() from public, anon;
revoke all on function public.mark_visitor_message_read(uuid) from public, anon;
revoke all on function public.delete_visitor_message(uuid) from public, anon;

grant execute on function public.get_my_message_settings() to authenticated;
grant execute on function public.set_accepts_messages(boolean) to authenticated;
grant execute on function public.get_my_visitor_messages() to authenticated;
grant execute on function public.mark_visitor_message_read(uuid) to authenticated;
grant execute on function public.delete_visitor_message(uuid) to authenticated;

commit;