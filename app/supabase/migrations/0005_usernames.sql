-- Optional username per phone. Demo only: no password, so a name proves nothing about who someone is.
-- Phones can add a name but never read the list. A taken name fails on the unique index.
create table public.usernames (
  device_id text primary key,
  username text not null check (username ~ '^[A-Za-z0-9_.ก-๙]{3,20}$'),
  created_at timestamptz not null default now()
);
create unique index usernames_username_key on public.usernames (lower(username));

revoke all on public.usernames from anon, authenticated;
grant insert on public.usernames to anon;
alter table public.usernames enable row level security;
create policy "demo add username" on public.usernames for insert to anon with check (true);

-- The name shown with a report on the admin dashboard.
alter table public.reports add column reporter_name text check (char_length(reporter_name) <= 20);
