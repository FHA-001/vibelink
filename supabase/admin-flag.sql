-- Nobody using the app can set or change is_admin.
-- Only the SQL editor and the service role (auth.uid() is null) can.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.is_admin := false;
    elsif new.is_admin is distinct from old.is_admin then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_admin on public.profiles;
create trigger protect_is_admin
  before insert or update on public.profiles
  for each row execute function public.protect_is_admin();

-- Lets the app ask "am I the admin?" about the signed-in user only
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Check: should return one row for the trigger
select tgname from pg_trigger where tgname = 'protect_is_admin';