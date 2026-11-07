-- Web Push: phones save their subscription here. They can add one but never read the list.
create table public.push_subscriptions (
  endpoint text primary key check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

revoke all on public.push_subscriptions from anon, authenticated;
grant insert on public.push_subscriptions to anon;
alter table public.push_subscriptions enable row level security;
create policy "demo add push subscription" on public.push_subscriptions for insert to anon with check (true);

-- Each alert can only trigger one round of notifications, however often the function is called.
alter table public.alerts add column push_sent_at timestamptz;
