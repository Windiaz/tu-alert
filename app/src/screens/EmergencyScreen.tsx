import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CircleCheck,
  ClipboardCheck,
  Flame,
  Map as MapIcon,
  Navigation,
  PersonStanding,
  Phone,
  Shield,
  TriangleAlert,
  Volume2,
} from "lucide-react";
import { clockTime, type AlertRow } from "../lib/data";

type Props = { alert: AlertRow; soundOff?: boolean; onSafe: () => Promise<boolean>; onClose: () => void };

export function EmergencyScreen({ alert, soundOff = false, onSafe, onClose }: Props) {
  const [safe, setSafe] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const closed = alert.status === "closed";

  const tapSafe = async () => {
    setSending(true);
    setFailed(false);
    const saved = await onSafe();
    setSending(false);
    setSafe(saved);
    setFailed(!saved);
  };

  return (
    <div className="flex h-full flex-col bg-alert">
      <header className="flex shrink-0 items-center gap-2 bg-[#8e0f13] px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 text-white">
        <Shield className="size-6" strokeWidth={2.4} aria-hidden="true" />
        <h1 className="text-xl font-bold">TU Alert</h1>
        <span className="mx-auto flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs font-bold">
          <span className="size-2 rounded-full bg-amber-400" /> LIVE FEED
        </span>
        <Building2 className="size-6" aria-hidden="true" />
      </header>
      <div className="flex shrink-0 items-center gap-2 bg-[#1c0a0a] px-5 py-1.5 text-xs font-bold text-white">
        <span className="size-2 shrink-0 rounded-full bg-amber-400" />
        <span className="flex-1 truncate">OFFICIAL TU SECURITY DISPATCH • IMMEDIATE ACTION</span>
        <span className="shrink-0 font-mono text-amber-200">PRIORITY-1</span>
      </div>
      {closed && <div className="shrink-0 bg-white px-5 py-1.5 text-xs font-bold text-ink">This incident has been closed.</div>}
      {/* Any tap unlocks sound (see App), and the siren then starts. */}
      {soundOff && !closed && (
        <button type="button" className="flex shrink-0 items-center justify-center gap-2 bg-amber-400 py-2 text-sm font-bold text-ink">
          <Volume2 className="size-4" aria-hidden="true" /> Tap for siren
        </button>
      )}

      <main className="flex-1 space-y-3 overflow-y-auto p-4">
        <section className="flex items-center gap-3 rounded-2xl border border-white/30 bg-[#8e0009] p-4 text-white">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-white text-brand">
            <TriangleAlert className="size-8" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-amber-300">CRITICAL ALERT</p>
            <h2 className="text-2xl leading-tight font-extrabold tracking-tight">CONFIRMED INCIDENT — NOT A DRILL</h2>
          </div>
        </section>

        <section className="rounded-2xl border-4 border-white bg-amber-400 p-4 text-ink">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest">
            <PersonStanding className="size-5 text-brand" aria-hidden="true" /> MANDATORY PROTOCOL
          </p>
          <p className="mt-2 text-3xl leading-tight font-extrabold tracking-tight">{alert.instruction?.toUpperCase() || "FOLLOW STAFF INSTRUCTIONS"}</p>
          {alert.assembly_point && <p className="mt-2 border-t border-black/20 pt-2 font-semibold leading-snug">Assemble at {alert.assembly_point}.</p>}
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-white p-4 pl-6 text-ink">
          <span className="absolute inset-y-0 left-0 w-2 bg-brand" />
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-alert">
              <Flame className="size-3.5" aria-hidden="true" /> CRITICAL
            </span>
            <span className="font-mono text-xs font-semibold text-muted">CODE: {alert.code}</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-muted">INCIDENT TYPE</p>
          <p className="text-2xl font-bold text-brand">{alert.title}</p>
          <p className="mt-2 text-xs font-semibold text-muted">PRECISE LOCATION</p>
          <p className="flex items-start gap-2 text-lg font-semibold leading-snug">
            <Navigation className="mt-1 size-5 shrink-0 text-brand" aria-hidden="true" /> {alert.building}
          </p>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <BadgeCheck className="size-6 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="font-semibold leading-snug">
              Verified by {alert.confirmed_by ?? "TU Security"} at {clockTime(alert.confirmed_at ?? alert.created_at)}
            </p>
          </div>
        </section>

        {/* The sample plan marks a fire origin, so it only appears for fire alerts. */}
        {/fire/i.test(alert.title) && (
          <section className="rounded-2xl bg-white p-4 text-ink">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold">
                <MapIcon className="size-5 text-brand" aria-hidden="true" /> Evacuation Plan (Demo)
              </h3>
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                <CircleCheck className="size-3.5" aria-hidden="true" /> EXIT CLEAR
              </span>
            </div>
            <FloorPlan />
            <p className="mt-2 text-center text-sm text-muted">Sample floor plan. Follow floor emergency markers to the nearest exit.</p>
          </section>
        )}

        <section className="rounded-2xl border border-white/20 bg-[#7c1212] p-4 text-sm text-white">
          <h3 className="flex items-center gap-2 font-bold">
            <ClipboardCheck className="size-4 text-amber-300" aria-hidden="true" /> Evacuation Checklist:
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Close room doors behind you (do NOT lock).</li>
            <li>Assist individuals with mobility challenges.</li>
          </ul>
        </section>
      </main>

      <div className="shrink-0 space-y-2.5 bg-[#150606] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {failed && <p role="alert" className="text-center text-sm font-semibold text-amber-300">Not sent. Check your connection and tap again.</p>}
        {closed ? (
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-slate-700 py-4 text-lg font-bold text-white">
            Close
          </button>
        ) : safe ? (
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-emerald-700 py-4 text-lg font-bold text-white">
            <CircleCheck className="size-6" aria-hidden="true" /> Marked safe. Close
          </button>
        ) : (
          <button type="button" onClick={tapSafe} disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-green-600 py-4 text-xl font-extrabold text-white disabled:opacity-70">
            <CircleCheck className="size-6" aria-hidden="true" /> {sending ? "Sending…" : "I'M SAFE (Acknowledge)"}
          </button>
        )}
        <a href="tel:025644444" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-white py-3.5 font-bold text-brand">
          <Phone className="size-5" aria-hidden="true" /> Call Campus Security (02-564-4444)
        </a>
      </div>
    </div>
  );
}

function FloorPlan() {
  return (
    <svg viewBox="0 0 340 180" role="img" aria-label="Demo floor plan with a route from your position to the East Stairwell" className="w-full rounded-xl bg-[#0f1a2c]">
      <rect x="18" y="14" width="304" height="134" rx="6" fill="#26324a" stroke="#9aa6bd" strokeWidth="2" />
      <rect x="28" y="24" width="84" height="56" fill="#7f1d1d" stroke="#ef4444" />
      <text x="70" y="50" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">FIRE ORIGIN</text>
      <text x="70" y="63" textAnchor="middle" fill="#fecaca" fontSize="8">Lab 301-304</text>
      <rect x="28" y="90" width="84" height="48" fill="#334155" stroke="#64748b" />
      <text x="70" y="118" textAnchor="middle" fill="#cbd5e1" fontSize="9">Seminar 3A</text>
      <rect x="128" y="24" width="56" height="36" fill="#334155" stroke="#94a3b8" />
      <text x="156" y="39" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="700">ELEVATOR</text>
      <text x="156" y="50" textAnchor="middle" fill="#f87171" fontSize="7">DO NOT USE</text>
      <path d="M128 24 184 60M184 24 128 60" stroke="#ef4444" strokeWidth="2" />
      <rect x="240" y="24" width="72" height="114" fill="#14532d" stroke="#22c55e" strokeWidth="2" />
      <text x="276" y="72" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">EAST</text>
      <text x="276" y="84" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">STAIRWELL</text>
      <text x="276" y="122" textAnchor="middle" fill="#bbf7d0" fontSize="8" fontWeight="700">SAFE EXIT</text>
      <path d="M170 116H208V90H250" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="6 3" strokeLinecap="round" />
      <circle cx="160" cy="116" r="9" fill="#2563eb" stroke="#fff" strokeWidth="3" />
      <text x="160" y="140" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="700">YOU ARE HERE</text>
      <text x="26" y="170" fill="#e2e8f0" fontSize="9" fontFamily="monospace">FASTEST ROUTE: 38 METERS (DEMO)</text>
    </svg>
  );
}
