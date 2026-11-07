# TU Alert demo app — plan

Goal: a working demo on real iPhones by **presentation day, Thu 12 Nov 2026**.

## Can it run on iPhone?

Yes. Build it as a **web app (PWA)** and host it on Vercel. Anyone opens the link in Safari, taps **Share → Add to Home Screen**, and it opens full-screen like a normal app. You don't need a Mac, Xcode, the App Store or an Apple developer account.

| Option | Runs on iPhone? | Needs a Mac? | Time to set up | Verdict |
|---|---|---|---|---|
| **Web app (PWA) on Vercel** | Yes, in Safari or from the Home Screen | No | Hours | **Use this** |
| React Native with Expo Go | Yes, inside the Expo Go app | No | 1–2 days extra | Only if you want a "real app" feel later |
| Native Swift app | Yes | Yes (Xcode) | Too long | Not before 12 Nov |

**Decided on 7 Nov: we build the PWA.** It is not a file like an APK. People "install" it by opening the link and adding it to the Home Screen. Share the link by AirDrop, LINE or a QR code.

What the web app can't do on iPhone: ring through silent mode or vibrate. Push alerts while the app is closed **do** work for free (iOS 16.4+, added to the Home Screen) and are planned for 10 Nov. Live updates while the app is open arrive instantly.

## What to set up first (today)

1. Install **Node.js LTS** and **Git** on your computer, if you don't have them.
2. Create free accounts: **Supabase** (database), **Vercel** (hosting), **GitHub** (code). Vercel and Supabase are already connected to Claude, so Claude can help set them up.
3. Open a terminal in this folder (`TU-Alert-App`) and run `claude`, or open the folder in the Claude desktop app's Code tab.
4. First message to Claude Code:
   > Read CLAUDE.md and docs/PLAN.md. Scaffold the app in app/ with Vite + React + TypeScript + Tailwind, add the Sarabun font and the tab bar, and deploy a hello page to Vercel.

## Day-by-day

| Date | Goal | Done when |
|---|---|---|
| Sat 7 Nov | Accounts (GitHub, Supabase, Vercel), scaffold, first deploy, Home Screen icon | The Vercel link opens on an iPhone and adds to the Home Screen |
| Sun 8 Nov | Student screens (Home, Report, Alerts, Profile) + Supabase tables + photo storage; Report form saves; basic admin queue using `src/ds` | A report sent from a phone shows in the admin queue — ready for the **SF231 presentation on Mon 9 Nov** |
| Mon 9 Nov | Admin dashboard with live status changes; alerts: create, confirm, send, full-screen alert, I'm safe count, drill screen | An alert from the laptop appears on 2+ phones together |
| Tue 10 Nov | Web Push for alerts while the app is closed; seed demo data; test on every member's iPhone | All 7 phones get the alert on campus Wi-Fi **and** mobile data |
| Wed 11 Nov | Full rehearsal, record a backup video, **feature freeze** | Demo runs twice in a row without fixes |
| Thu 12 Nov | Presentation day | |

## Who does what (proposed)

| Role | Owner | Work |
|---|---|---|
| Lead | | Keeps this plan on track, runs the rehearsal |
| Student app | | Home, Report, Alerts, Profile screens |
| Backend | | Supabase tables, storage, realtime |
| Admin dashboard | | Report queue, alert sender, I'm safe counter |
| Testing | | Tests on everyone's iPhone, collects bugs |
| Demo | | Seed data, demo script, backup video |
| Presenter | | Talks through the demo on stage |

## Must have vs nice to have

**Must have:** report with photo, live status updates, admin queue, confirmed alert on all phones, I'm safe count, drill screen.

**Should have (10 Nov):** Web Push while the app is closed.

**Nice to have:** alerts history page, notification settings page, Thai language toggle, floor evacuation map.

## Risks on demo day

| Risk | Plan B |
|---|---|
| Campus Wi-Fi blocks or is slow | Use phones on mobile data; a hotspot for the laptop |
| A phone doesn't get the live alert | Pull to refresh; the alert also shows on Home |
| Supabase or Vercel down | Play the backup video recorded on 11 Nov |
| No sound on iPhone | Tap "Turn on alerts" once before the demo starts |
