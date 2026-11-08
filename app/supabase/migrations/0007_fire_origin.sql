-- Where the admin says the fire started, as { level, spot }. Null until it is known.
alter table public.alerts
  add column fire_origin jsonb check (fire_origin is null or jsonb_typeof(fire_origin) = 'object');

grant update (fire_origin) on public.alerts to anon;
