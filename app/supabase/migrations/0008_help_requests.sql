-- "I need help" during an alert. One open request per phone per alert.
-- Demo only: the public key can read these, and nobody responds outside the class demo.
create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  device_id text not null,
  name text check (char_length(name) <= 20),
  level int check (level between 1 and 7),
  area text check (char_length(area) <= 30),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  unique (alert_id, device_id)
);

revoke all on public.help_requests from anon, authenticated;
grant select, insert on public.help_requests to anon;
grant update (level, area, handled_at) on public.help_requests to anon;

alter table public.help_requests enable row level security;
create policy "demo read help" on public.help_requests for select to anon using (true);
create policy "demo add help" on public.help_requests for insert to anon with check (handled_at is null);
create policy "demo update help" on public.help_requests for update to anon using (true) with check (true);

alter publication supabase_realtime add table public.help_requests;
