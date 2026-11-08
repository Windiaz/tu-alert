-- Sample reports so the admin dashboard isn't empty. Fake and labelled as demo.
-- None are 'submitted', so "Handle next" goes straight to the report made live on stage.
insert into public.reports (code, category, building, floor, room, note, status, device_id, reporter_name, created_at) values
  ('TU-0101', 'Safety hazard', 'Engineering Administration Building', 'Floor 5', 'Corridor', '(Demo) Loose handrail near the stairs', 'in_progress', 'demo-seed', 'Demo data', '2026-11-07 15:20+07'),
  ('TU-0102', 'Safety hazard', 'SC3 Lecture Halls', 'Floor 1', 'Entrance', '(Demo) Wet floor with no warning sign', 'resolved', 'demo-seed', 'Demo data', '2026-11-03 09:10+07'),
  ('TU-0103', 'Air conditioning', 'Engineering Administration Building', 'Floor 3', 'Room 305', '(Demo) AC is leaking onto the desks', 'in_progress', 'demo-seed', 'Demo data', '2026-11-06 13:40+07'),
  ('TU-0104', 'Air conditioning', 'SC3 Lecture Halls', 'Floor 2', 'Room 2204', '(Demo) Room stays hot with AC on', 'acknowledged', 'demo-seed', 'Demo data', '2026-11-07 17:30+07'),
  ('TU-0105', 'Electrical', 'Engineering Administration Building', 'Floor 6', 'Room 604-2', '(Demo) Two ceiling lights flickering', 'acknowledged', 'demo-seed', 'Demo data', '2026-11-07 11:05+07'),
  ('TU-0106', 'Plumbing', 'Learning Resort', 'Floor 1', 'Restroom', '(Demo) Sink tap does not turn off', 'resolved', 'demo-seed', 'Demo data', '2026-11-02 16:30+07'),
  ('TU-0107', 'Cleanliness', 'Engineering Administration Building', 'Floor 2', 'Reading room', '(Demo) Bins are overflowing', 'resolved', 'demo-seed', 'Demo data', '2026-11-04 10:15+07'),
  ('TU-0108', 'Other', 'Learning Resort', 'Floor 2', 'Study area', '(Demo) Broken chair by the window', 'acknowledged', 'demo-seed', 'Demo data', '2026-11-05 14:50+07');
