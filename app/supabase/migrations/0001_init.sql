-- TU Alert demo schema. See CLAUDE.md "Data model".
-- There is no login in the demo, so phones and the admin page both use the anon key.
-- That means anyone with the public key can read reports and send alerts: fine for a
-- class demo with fake data, NOT for real use. Permissions below are kept as narrow as
-- that allows: no deletes, and reports can only have their status changed.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text not null,
  building text not null,
  floor text,
  room text,
  note text check (char_length(note) <= 120),
  photo_url text,
  status text not null default 'submitted'
    check (status in ('submitted', 'acknowledged', 'in_progress', 'resolved')),
  device_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('confirmed', 'drill')),
  title text not null,
  building text,
  instruction text,
  assembly_point text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active', 'closed')),
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.acks (
  alert_id uuid not null references public.alerts (id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (alert_id, device_id)
);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- Table permissions
revoke all on public.reports, public.alerts, public.acks from anon, authenticated;
grant select, insert on public.reports, public.alerts, public.acks to anon;
grant update (status) on public.reports to anon;
grant update (status) on public.alerts to anon;

-- Row level security
alter table public.reports enable row level security;
alter table public.alerts enable row level security;
alter table public.acks enable row level security;

create policy "demo read reports" on public.reports for select to anon using (true);
create policy "demo add reports" on public.reports for insert to anon with check (status = 'submitted');
create policy "demo update report status" on public.reports for update to anon using (true) with check (true);

create policy "demo read alerts" on public.alerts for select to anon using (true);
create policy "demo add alerts" on public.alerts for insert to anon with check (status = 'active');
create policy "demo close alerts" on public.alerts for update to anon using (true) with check (true);

create policy "demo read acks" on public.acks for select to anon using (true);
create policy "demo add acks" on public.acks for insert to anon with check (true);

-- Realtime: push row changes to every open phone and laptop
alter publication supabase_realtime add table public.reports, public.alerts, public.acks;

-- Photo storage: public read by URL, upload images only, max 10 MB, no overwrite or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

create policy "demo upload report photos" on storage.objects for insert to anon
  with check (bucket_id = 'report-photos');
