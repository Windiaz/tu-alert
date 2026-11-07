-- Sample history so the Alerts tab isn't empty. Fake and labelled as demo. Closed, so no phone pops up.
insert into public.alerts (code, type, title, building, status, starts_at, ends_at, confirmed_by, created_at) values
  ('DEMO-0815', 'drill', 'Campus-Wide PA System Audio Check (Demo)', 'Main Library & Gymnasiums', 'closed', '2026-08-15 09:30+07', null, 'Thammasat Safety Division', '2026-08-15 09:00+07'),
  ('DEMO-0930', 'drill', 'Severe Weather & Flash Flood Siren Test (Demo)', 'All Thammasat Rangsit Campuses', 'closed', '2026-09-30 10:00+07', '2026-09-30 10:15+07', 'Thammasat Safety Division', '2026-09-30 09:30+07'),
  ('DEMO-1018', 'drill', 'Annual Evacuation Drill, Rangsit Zone B (Demo)', 'Engineering & SC3 Complexes', 'closed', '2026-10-18 14:00+07', '2026-10-18 14:45+07', 'Thammasat Safety Division', '2026-10-18 13:45+07');
