-- Stairs the admin has closed during an alert, as a list of { stair, level }.
-- Each entry means closed from that level upward, because nobody can pass that level.
alter table public.alerts
  add column closed_stairs jsonb not null default '[]'::jsonb
  check (jsonb_typeof(closed_stairs) = 'array');

-- As with closing an alert, the demo has no login, so this uses the public key.
grant update (closed_stairs) on public.alerts to anon;
