begin;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check (product in ('nfc_card', 'vibetags')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, product)
);

-- No direct table access: only through the functions below
alter table public.waitlist_signups enable row level security;
revoke all on public.waitlist_signups from anon, authenticated;

create or replace function public.join_waitlist(p_product text)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  if p_product is null or p_product not in ('nfc_card', 'vibetags') then
    raise exception 'Unknown product';
  end if;

  insert into public.waitlist_signups (user_id, product)
  values (auth.uid(), p_product)
  on conflict (user_id, product) do nothing;
end;
$$;

create or replace function public.leave_waitlist(p_product text)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  delete from public.waitlist_signups
  where user_id = auth.uid() and product = p_product;
end;
$$;

create or replace function public.get_my_waitlist()
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
    select jsonb_agg(product order by product)
    from public.waitlist_signups
    where user_id = auth.uid()
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.join_waitlist(text) from public, anon;
revoke all on function public.leave_waitlist(text) from public, anon;
revoke all on function public.get_my_waitlist() from public, anon;

grant execute on function public.join_waitlist(text) to authenticated;
grant execute on function public.leave_waitlist(text) to authenticated;
grant execute on function public.get_my_waitlist() to authenticated;

commit;