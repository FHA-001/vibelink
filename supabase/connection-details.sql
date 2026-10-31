begin;

create table if not exists public.connection_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  met_at text check (met_at is null or char_length(met_at) <= 100),
  follow_up_at date,
  follow_up_done boolean not null default false,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, connection_id)
);

-- Private to each user: no direct table access, only through the functions below
alter table public.connection_details enable row level security;
revoke all on public.connection_details from anon, authenticated;

create or replace function public.upsert_connection_details(
  p_connection_id uuid,
  p_met_at text,
  p_follow_up_at date
)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_met text := nullif(trim(p_met_at), '');
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if p_connection_id is null then
    raise exception 'Connection ID cannot be NULL';
  end if;
  if v_met is not null and char_length(v_met) > 100 then
    raise exception 'Place must be 100 characters or fewer';
  end if;
  if not exists (
    select 1 from public.connections
    where id = p_connection_id
      and (user_one_id = auth.uid() or user_two_id = auth.uid())
  ) then
    raise exception 'Connection not found or access denied';
  end if;

  -- Nothing left to store: remove the row
  if v_met is null and p_follow_up_at is null then
    delete from public.connection_details
    where user_id = auth.uid() and connection_id = p_connection_id;
    return;
  end if;

  insert into public.connection_details (user_id, connection_id, met_at, follow_up_at, follow_up_done)
  values (auth.uid(), p_connection_id, v_met, p_follow_up_at, false)
  on conflict (user_id, connection_id)
  do update set
    met_at = excluded.met_at,
    -- a new date means a new reminder, so it is not "done" any more
    follow_up_done = case
      when excluded.follow_up_at is distinct from public.connection_details.follow_up_at then false
      else public.connection_details.follow_up_done
    end,
    follow_up_at = excluded.follow_up_at,
    updated_at = timezone('utc'::text, now());
end;
$$;

create or replace function public.get_connection_details(p_connection_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_row public.connection_details%rowtype;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if p_connection_id is null then
    raise exception 'Connection ID cannot be NULL';
  end if;

  select * into v_row
  from public.connection_details
  where user_id = auth.uid() and connection_id = p_connection_id;

  return jsonb_build_object(
    'met_at', v_row.met_at,
    'follow_up_at', v_row.follow_up_at,
    'follow_up_done', coalesce(v_row.follow_up_done, false)
  );
end;
$$;

create or replace function public.set_follow_up_done(p_connection_id uuid, p_done boolean)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if p_connection_id is null then
    raise exception 'Connection ID cannot be NULL';
  end if;

  update public.connection_details
  set follow_up_done = coalesce(p_done, false),
      updated_at = timezone('utc'::text, now())
  where user_id = auth.uid() and connection_id = p_connection_id;
end;
$$;

-- Open reminders only, soonest first. Returns connection ids, not people:
-- the app matches them against the connections it already loads.
create or replace function public.get_my_follow_ups()
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
        'connection_id', d.connection_id,
        'met_at', d.met_at,
        'follow_up_at', d.follow_up_at
      )
      order by d.follow_up_at
    )
    from (
      select connection_id, met_at, follow_up_at
      from public.connection_details
      where user_id = auth.uid()
        and follow_up_at is not null
        and follow_up_done = false
      order by follow_up_at
      limit 50
    ) d
  ), '[]'::jsonb);
end;
$$;

-- Signed-in users only
revoke all on function public.upsert_connection_details(uuid, text, date) from public, anon;
revoke all on function public.get_connection_details(uuid) from public, anon;
revoke all on function public.set_follow_up_done(uuid, boolean) from public, anon;
revoke all on function public.get_my_follow_ups() from public, anon;

grant execute on function public.upsert_connection_details(uuid, text, date) to authenticated;
grant execute on function public.get_connection_details(uuid) to authenticated;
grant execute on function public.set_follow_up_done(uuid, boolean) to authenticated;
grant execute on function public.get_my_follow_ups() to authenticated;

commit;