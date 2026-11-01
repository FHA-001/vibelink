begin;

-- The email and phone each person chooses to share. Private: no direct access.
create table if not exists public.profile_contact_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$'),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('email', 'phone')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  responded_at timestamptz,
  unique (requester_id, owner_id, kind),
  check (requester_id <> owner_id)
);

create index if not exists contact_requests_owner_idx on public.contact_requests (owner_id, status);

alter table public.profile_contact_details enable row level security;
alter table public.contact_requests enable row level security;
revoke all on public.profile_contact_details from anon, authenticated;
revoke all on public.contact_requests from anon, authenticated;

-- Internal helper: true if either person has blocked the other
create or replace function public.contact_users_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create or replace function public.save_my_contact_details(p_email text, p_phone text)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_email text := nullif(lower(trim(p_email)), '');
  v_phone text := nullif(trim(p_phone), '');
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Complete your profile first';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Please enter a valid email address';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    raise exception 'Please enter a valid phone number';
  end if;

  if v_email is null and v_phone is null then
    delete from public.profile_contact_details where user_id = auth.uid();
    return;
  end if;

  insert into public.profile_contact_details (user_id, email, phone)
  values (auth.uid(), v_email, v_phone)
  on conflict (user_id)
  do update set email = excluded.email,
                phone = excluded.phone,
                updated_at = timezone('utc'::text, now());
end;
$$;

create or replace function public.get_my_contact_details()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_row public.profile_contact_details%rowtype;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  select * into v_row from public.profile_contact_details where user_id = auth.uid();

  return jsonb_build_object('email', v_row.email, 'phone', v_row.phone);
end;
$$;

create or replace function public.request_contact(p_owner_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_existing public.contact_requests%rowtype;
  v_has boolean;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if p_owner_id is null or p_kind is null or p_kind not in ('email', 'phone') then
    raise exception 'Invalid request';
  end if;
  if p_owner_id = auth.uid() then
    raise exception 'You cannot request your own details';
  end if;

  -- The requester needs a finished profile, so the owner can see who is asking
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and coalesce(trim(username), '') <> ''
      and coalesce(trim(full_name), '') <> ''
  ) then
    raise exception 'Complete your profile before requesting contact details';
  end if;

  if not exists (select 1 from public.profiles where id = p_owner_id) then
    raise exception 'Unable to complete request';
  end if;
  if public.contact_users_blocked(auth.uid(), p_owner_id) then
    raise exception 'Unable to complete request';
  end if;

  select case when p_kind = 'email' then email is not null else phone is not null end
  into v_has
  from public.profile_contact_details
  where user_id = p_owner_id;

  if not coalesce(v_has, false) then
    raise exception 'Unable to complete request';
  end if;

  -- At most 20 requests per person per day
  if (
    select count(*) from public.contact_requests
    where requester_id = auth.uid()
      and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'You have sent a lot of requests today. Please try again tomorrow.';
  end if;

  select * into v_existing
  from public.contact_requests
  where requester_id = auth.uid() and owner_id = p_owner_id and kind = p_kind;

  if found then
    if v_existing.status in ('pending', 'approved') then
      return;
    end if;
    -- Declined: wait 30 days before asking again
    if coalesce(v_existing.responded_at, 'epoch'::timestamptz) > now() - interval '30 days' then
      raise exception 'You can ask again later';
    end if;
    update public.contact_requests
    set status = 'pending', created_at = now(), responded_at = null
    where id = v_existing.id;
    return;
  end if;

  insert into public.contact_requests (requester_id, owner_id, kind)
  values (auth.uid(), p_owner_id, p_kind);
end;
$$;

create or replace function public.respond_contact_request(p_request_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_req public.contact_requests%rowtype;
  v_has boolean;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  select * into v_req
  from public.contact_requests
  where id = p_request_id and owner_id = auth.uid();

  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been answered';
  end if;
  if public.contact_users_blocked(auth.uid(), v_req.requester_id) then
    raise exception 'Unable to complete request';
  end if;

  if coalesce(p_approve, false) then
    select case when v_req.kind = 'email' then email is not null else phone is not null end
    into v_has
    from public.profile_contact_details
    where user_id = auth.uid();

    if not coalesce(v_has, false) then
      raise exception 'Add your % in Edit Profile before approving', v_req.kind;
    end if;
  end if;

  update public.contact_requests
  set status = case when coalesce(p_approve, false) then 'approved' else 'declined' end,
      responded_at = now()
  where id = v_req.id;
end;
$$;

create or replace function public.revoke_contact_access(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  update public.contact_requests
  set status = 'declined', responded_at = now()
  where id = p_request_id and owner_id = auth.uid() and status = 'approved';
end;
$$;

-- Pending and approved requests for the signed-in owner
create or replace function public.get_my_contact_requests()
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
    select jsonb_agg(t.row_data order by t.created_at desc)
    from (
      select
        jsonb_build_object(
          'id', r.id,
          'kind', r.kind,
          'status', r.status,
          'requester_id', r.requester_id,
          'username', p.username,
          'full_name', p.full_name,
          'profile_photo', p.profile_photo,
          'created_at', r.created_at
        ) as row_data,
        r.created_at
      from public.contact_requests r
      join public.profiles p on p.id = r.requester_id
      where r.owner_id = auth.uid()
        and r.status in ('pending', 'approved')
        and not public.contact_users_blocked(auth.uid(), r.requester_id)
      order by r.created_at desc
      limit 50
    ) t
  ), '[]'::jsonb);
end;
$$;

-- What the signed-in visitor may know about another person's contact details.
-- The actual email or phone is returned only after the owner approved it.
create or replace function public.get_contact_card(p_owner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_details public.profile_contact_details%rowtype;
  v_email_status text;
  v_phone_status text;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  if p_owner_id is null
     or p_owner_id = auth.uid()
     or not exists (select 1 from public.profiles where id = p_owner_id)
     or public.contact_users_blocked(auth.uid(), p_owner_id) then
    return jsonb_build_object(
      'email_available', false, 'phone_available', false,
      'email_status', null, 'phone_status', null,
      'email', null, 'phone', null
    );
  end if;

  select * into v_details from public.profile_contact_details where user_id = p_owner_id;

  select status into v_email_status from public.contact_requests
  where requester_id = auth.uid() and owner_id = p_owner_id and kind = 'email';

  select status into v_phone_status from public.contact_requests
  where requester_id = auth.uid() and owner_id = p_owner_id and kind = 'phone';

  return jsonb_build_object(
    'email_available', v_details.email is not null,
    'phone_available', v_details.phone is not null,
    'email_status', v_email_status,
    'phone_status', v_phone_status,
    'email', case when v_email_status = 'approved' then v_details.email end,
    'phone', case when v_phone_status = 'approved' then v_details.phone end
  );
end;
$$;

-- Internal helper: nobody can call it directly
revoke all on function public.contact_users_blocked(uuid, uuid) from public, anon, authenticated;

-- Signed-in users only
revoke all on function public.save_my_contact_details(text, text) from public, anon;
revoke all on function public.get_my_contact_details() from public, anon;
revoke all on function public.request_contact(uuid, text) from public, anon;
revoke all on function public.respond_contact_request(uuid, boolean) from public, anon;
revoke all on function public.revoke_contact_access(uuid) from public, anon;
revoke all on function public.get_my_contact_requests() from public, anon;
revoke all on function public.get_contact_card(uuid) from public, anon;

grant execute on function public.save_my_contact_details(text, text) to authenticated;
grant execute on function public.get_my_contact_details() to authenticated;
grant execute on function public.request_contact(uuid, text) to authenticated;
grant execute on function public.respond_contact_request(uuid, boolean) to authenticated;
grant execute on function public.revoke_contact_access(uuid) to authenticated;
grant execute on function public.get_my_contact_requests() to authenticated;
grant execute on function public.get_contact_card(uuid) to authenticated;

commit;