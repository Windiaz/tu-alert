# Handoff from the planning chat (claude.ai), 7 Nov 2026

This file summarises everything decided in the planning chat so Claude Code can carry on. Read `CLAUDE.md` first, then this file.

## Where the project stands

- The business documents are done and live in `reference/`: business model canvas, opportunity canvas, persona (Ploy), operation plan, marketing plan, and the financial Excel.
- Course deadlines from the teacher: marketing plan 15 Oct, operation plan 29 Oct (moved from 22 Oct), financial plan 29 Oct, app work 30 Oct–11 Nov, **presentation day 12 Nov 2026**.
- Team: 7 members (`docs/MEMBERS.md`).

## Numbers already used in the slides (keep the app and pitch consistent)

- Price: free single-faculty pilot, then THB 15,000–30,000 per faculty per year. Students never pay.
- Example costs: startup 1,500 THB (domain 500 + app store account 1,000); hosting about 500 THB a month; push alerts free in year 1; support from year 2. Year 1 cost is about 13,500 THB, about 1,929 THB each.
- Sales plan suggested: 0 paying faculties in year 1 (free pilot), then 2, 4, 7 and 10 out of Thammasat's ~33 faculties, colleges and institutes.
- Suggested initial investment: about 15,000 THB of founder equity, no loan (35,000 THB if planning for late university payments).

## Decision (7 Nov): build a PWA

We build the **web app (PWA)** on Vercel + Supabase described in `CLAUDE.md` and `docs/PLAN.md`. Work is on the Windows PC; no Mac or Xcode is needed. Reasons:
- Every teammate (and the class) can install it from a link or QR code.
- It doesn't expire after 7 days.
- Web Push gives real push notifications for free on iOS 16.4+ once it's added to the Home Screen.

Native Xcode was considered and dropped. For the record, here is what we learned:

- **Xcode needs a Mac.** Xcode 26.3+ has Claude built in, and Claude Code in the Mac terminal can connect to Xcode.
- **Free Apple ID:** you can install on your own iPhone by cable, and the app expires after 7 days (reinstall on 11 Nov). No remote push notifications.
- **Paid Apple Developer Program (US$99/yr):** remote push (APNs) works, and teammates can install through a TestFlight link.
- **AirDrop cannot install an app** on another iPhone. AirDropping a web link does work.
- **No ringing through silent mode:** "Critical Alerts" needs special Apple approval, which won't happen in time.

- The presenter's Mac has Xcode 16.2 and the iPhone runs iOS 18.5. That is fine for a PWA (iOS 16.4+ needed for Web Push).

**First step for Claude Code:** start `docs/PLAN.md` at Sat 7 Nov: GitHub, Supabase and Vercel accounts, scaffold in `app/`, first deploy.

## Demo must show (either stack)

1. Report with photo → appears on the admin laptop.
2. Admin changes status → phone updates live.
3. Admin sends a confirmed incident → phone shows the red full-screen alert → "I'm safe" → counter on the laptop.
4. Admin sends a scheduled drill → calm blue screen.

Full script: `docs/DEMO_SCRIPT.md`.
