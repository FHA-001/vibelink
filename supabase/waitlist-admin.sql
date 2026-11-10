alter table public.waitlist_signups
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_status_check;
alter table public.waitlist_signups
  add constraint waitlist_signups_status_check
  check (status in ('new', 'contacted', 'interested', 'converted', 'unsubscribed'));

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_note_length_check;
alter table public.waitlist_signups
  add constraint waitlist_signups_note_length_check
  check (admin_note is null or length(admin_note) <= 1000);

-- Admin notes and statuses are internal. Signed-in members and visitors must
-- never be able to read or change them directly. The app only touches this
-- table through the join/leave/get functions (which run with owner rights)
-- and through the admin routes (which use the service role).
revoke all on table public.waitlist_signups from anon, authenticated;

-- Check: all existing rows should be 'new'
select status, count(*) from public.waitlist_signups group by status;