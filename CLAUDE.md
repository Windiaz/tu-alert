# TU Alert — demo app

Read this first. It explains what we are building, for whom, and the rules for this repo.

## What TU Alert is

A campus safety app for Thammasat University (Rangsit campus first). It does two jobs:

1. **Verified emergency alerts in two tiers.**
   - Tier 1 is rare and mandatory: a *confirmed incident, not a drill*. It is only sent after an authorised person in the security office confirms it.
   - Tier 2 is routine and adjustable: scheduled drill notices, report status updates and a weekly maintenance digest.
   - The problem it solves: alarms carry no information, so students assume every alarm is a drill (normalcy bias) and wait to see what others do.
2. **Facility complaint reporting with a visible status.** A student reports a broken or unsafe thing with a photo, category and location, then watches it move through Submitted → Acknowledged → In progress → Resolved. The problem it solves: reports by email or LINE "disappear into silence".

Users are students and staff. Payers are the university: facilities management, the security office or student affairs. Students never pay.

Persona: **Ploy, 20**, Year 2 engineering, lives in a dorm near Rangsit. She can't tell a real alarm from a drill, she emailed about a broken AC weeks ago and never heard back, and she muted the faculty LINE group.

## What the demo must show (SF231 on 9 Nov 2026, DE321 presentation day on 12 Nov 2026)

The demo runs on **real iPhones (student view)** plus **a laptop (admin view)** at the same time:

1. A student opens TU Alert on an iPhone and submits a report (photo + category + location). It appears on the admin dashboard on the laptop within a second or two.
2. The admin changes the status (Acknowledged → In progress → Resolved). The student's phone updates live.
3. The admin creates an alert, marks it **Confirmed incident** and sends it. Every phone shows the full-screen red alert. Students tap **I'm safe** and the admin sees the count go up.
4. The admin sends a **Scheduled drill** notice. Phones show the calm blue drill screen ("Scheduled drill — no hazard").

If something can only be faked for the demo, fake it quietly with seed data, but steps 1–3 must really work live.

## Tech stack (chosen so it runs on iPhone without a Mac)

- **Web app (PWA)**: Vite + React + TypeScript + Tailwind CSS. Students open the URL in Safari, then use *Share → Add to Home Screen* so it opens full-screen like an app.
- **Backend**: Supabase, for the Postgres database, photo storage and **Realtime**, which pushes live updates to every open phone.
- **Hosting**: Vercel. Every push to `main` deploys.
- **Decided 7 Nov: PWA only, no native iOS build.** Development happens on the Windows PC. No Mac or Xcode is needed.

### iPhone limits to respect

- Live updates work while the app is open (Supabase Realtime). That is enough for the demo.
- Real push notifications while the app is closed are **free** with Web Push (VAPID keys, no Apple developer account). They need iOS 16.4+, the app added to the Home Screen, and a tap on a button before asking permission. Do this after the must-haves work (see `docs/PLAN.md`, 10 Nov). Send the pushes from a Supabase Edge Function when an alert is created.
- Web apps **cannot** bypass silent mode or Do Not Disturb. "Critical Alerts" need a special Apple entitlement for native apps. Don't claim it in the UI.
- Safari blocks sound until the user taps once. Show a one-time "Turn on alerts" button on first open that plays a short sound to unlock audio.
- `navigator.vibrate` does not work on iPhone. Don't rely on it.

## Screens (match the prototype in `design/screens/`)

Student app with a bottom tab bar: **Home · Report · Alerts · Profile**.

| Screen | File | Must have |
|---|---|---|
| Home | `design/screens/01-home.jpg` | Building status card ("All clear", active alerts count), big red **Report an issue** button, emergency numbers, **My reports** list with status filter chips |
| Report an issue | `design/screens/02-report.jpg` | 1 photo (camera or upload), 2 category (Electrical, Air conditioning, Plumbing, Safety hazard, Cleanliness, Other), 3 location (building, floor, room), 4 short note (max 120 chars), Submit |
| Confirmed incident | `design/screens/03-emergency.jpg` | Full-screen red, "CONFIRMED INCIDENT — NOT A DRILL", instruction box, location, "Verified by … at time", **I'm safe** button, **Call campus security** button |
| Scheduled drill | `design/screens/04-drill.jpg` | Calm blue, "SCHEDULED DRILL — NO HAZARD", area, time window, "No action needed unless instructed", **Understood** button |
| Alerts history | `design/screens/05-alerts-history.jpg` | Tabs All / Confirmed / Drills, one card per alert |
| Notification settings | `design/screens/06-notifications.jpg` | Tier 1 locked on, Tier 2 toggles (drill notices, report status, weekly digest) |

Admin dashboard at `/admin`, for laptop width:
- Report queue (newest first), with photo, category, location and a status dropdown.
- **New alert** form: type (Confirmed incident / Scheduled drill), building, title, instruction, assembly point. **Send** asks "Confirm this is real?" for Confirmed incidents.
- Live acknowledgment counter for the active alert ("12 safe").
- For the demo, protect it with a simple PIN from an env var. It is not real security.

## Data model (Supabase)

```
reports   id uuid pk, code text (e.g. TU-8842), category text, building text, floor text,
          room text, note text, photo_url text, status text check in
          ('submitted','acknowledged','in_progress','resolved'), device_id text,
          created_at timestamptz default now(), updated_at timestamptz
alerts    id uuid pk, code text, type text check in ('confirmed','drill'), title text,
          building text, instruction text, assembly_point text, starts_at timestamptz,
          ends_at timestamptz, status text check in ('active','closed'),
          confirmed_by text, confirmed_at timestamptz, created_at timestamptz default now()
acks      alert_id uuid fk alerts, device_id text, created_at timestamptz default now(),
          primary key (alert_id, device_id)
```

Storage bucket: `report-photos` (public read for the demo).

No student login for the demo. Generate a random `device_id` on first open and keep it in `localStorage`, so each phone sees only its own reports.

Turn on Realtime for `reports`, `alerts` and `acks`.

## Design

- Colours: TU crimson `#A31D3A` (primary), dark crimson `#7A1429`, alert red `#B71C1C`, cream background `#F6F3EF`, white cards with border `#E8E2DC` and radius 16–18px. Status colours: Submitted grey, Acknowledged blue, In progress amber, Resolved green.
- Font: **Sarabun** (Google Fonts). It supports Thai and English.
- UI text in English, like the prototype. Thai names and places must render correctly.
- Mobile first, sized for iPhone (390px wide). Respect safe areas (`env(safe-area-inset-*)`) so nothing hides under the notch or home bar.

## Content rules

- Emergency numbers shown in the prototype: **191** and campus security **02-564-4444**. Check the campus number with the team before presenting.
- Don't mention the US Clery Act or "iOS Critical Alert Entitlement". They appear in the prototype but don't apply here.
- Sample data uses real Rangsit places (Engineering Building 2, SC3, Learning Resort) but is fake. Label seed data as demo.

## Working rules for Claude Code

- Keep the app in `app/`. Planning documents are in `docs/` and the prototype images are in `design/`.
- Put secrets (Supabase URL and anon key, admin PIN) in `app/.env.local`. Never commit them. Keep `app/.env.example` up to date.
- After each feature: run the build, then check it at 390px width in the browser.
- Small commits with clear messages. Deploy to Vercel and test on a real iPhone at least once a day from 8 Nov.
- Follow `docs/PLAN.md` for order and dates, and `docs/DEMO_SCRIPT.md` for what must work on stage.

## SF231 (Data Structures) — required, presented 9 Nov 2026

This same app is also presented in SF231 Data Structures and Algorithms. The team has to explain the code using lecture topics. `app/src/ds/` already contains the hand-written structures. They pass `npx tsx src/ds/ds.test.ts` and type-check in strict mode.

- **Do not replace them with built-ins** (Array methods for the queue, `Map`, `Array.sort`) in the places below. Import from `src/ds`.
- Keep the lecture-style comments and names (addFirst, enqueue, dequeue, push, pop, peek, `H(key) = key % hashSize`).

| Feature | Must use |
|---|---|
| Alert history on the phone | `SList`, `addFirst` for each new alert |
| Admin report queue, plus a "Handle next" button that dequeues | `Queue` |
| Offline outbox: reports submitted with no internet, sent in order when back online | `Queue` |
| Screen history for the Back button | `Stack` |
| Admin "Undo last status change" | `Stack` |
| "I'm safe" counter, one count per device id | `HashMap` |
| Find report by ticket code on admin | `HashMap` |
| Admin report list order (safety hazards first, then newest) | `mergeSort` + `byPriorityThenNewest` |
| "My reports" order on the phone | `insertionSort` + `byNewest` |

`docs/SF231_CODE_EXPLAINED.md` is the team's explanation. If the code changes how a structure is used, update that file too.

## Business context (for wording and numbers)

- Pricing: free single-faculty pilot, then THB 15,000–30,000 per faculty per year. Students always free.
- Running cost: about 0 THB to build, hosting a few hundred THB per month.
- Team: 7 students. Member list is in `docs/MEMBERS.md`.
- Full plans are in `reference/`: business model canvas, persona, operation plan, marketing plan, cost Excel.
