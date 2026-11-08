import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  CircleCheck,
  ClipboardCheck,
  Flame,
  Footprints,
  HandHelping,
  Map as MapIcon,
  Navigation,
  PersonStanding,
  Phone,
  Shield,
  TriangleAlert,
  Volume2,
} from "lucide-react";
import { BuildingModel, floorFromLocation, ROUTE_SECTION_ID } from "../components/BuildingModel";
import { areasOnLevel, fireSpots, isModelBuilding, stairFromInstruction } from "../lib/buildingLayout";
import { clockTime, type AlertRow } from "../lib/data";

type Props = { alert: AlertRow; soundOff?: boolean; onSafe: () => Promise<boolean>; onHelp?: (level: number | null, area: string | null) => Promise<boolean>; onClose: () => void };

export function EmergencyScreen({ alert, soundOff = false, onSafe, onHelp, onClose }: Props) {
  const [safe, setSafe] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [help, setHelp] = useState<"idle" | "asking" | "sending" | "sent" | "failed">("idle");
  const [place, setPlace] = useState<{ level: number | null; area: string }>(() => ({ level: floorFromLocation(alert.building) ?? alert.fire_origin?.level ?? null, area: "" }));
  const closed = alert.status === "closed";
  const hasModel = isModelBuilding(alert.building);
  const closedStairs = alert.closed_stairs ?? [];
  const fire = alert.fire_origin ?? null;
  const firePlace = fire && fireSpots(fire.level).find((spot) => spot.id === fire.spot)?.label;

  const tapSafe = async () => {
    setSending(true);
    setFailed(false);
    const saved = await onSafe();
    setSending(false);
    setSafe(saved);
    setFailed(!saved);
  };

  const sendHelp = async (level: number | null, area: string | null) => {
    setHelp("sending");
    setHelp((await onHelp?.(level, area)) ? "sent" : "failed");
  };

  // The route picker already knows the place. Otherwise ask first, but never insist.
  const tapHelp = () => {
    if (!hasModel) void sendHelp(null, null);
    else if (place.area) void sendHelp(place.level, place.area);
    else setHelp("asking");
  };

  const canAskHelp = Boolean(onHelp) && !closed && !safe && help !== "sent";

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
          {!closed && fire && firePlace && (
            <p role="alert" className="mt-2 flex items-start gap-2 rounded-lg bg-[#8e0009] px-3 py-2 font-bold leading-snug text-white">
              <Flame className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> FIRE STARTED: level {fire.level}, {firePlace}.
            </p>
          )}
          {!closed &&
            closedStairs.map(({ stair, level }) => (
              <p key={stair} role="alert" className="mt-2 rounded-lg bg-[#8e0009] px-3 py-2 font-bold leading-snug text-white">
                {stair.toUpperCase()} STAIRS CLOSED from level {level} up. Do not use them.
              </p>
            ))}
          {hasModel && (
            <button
              type="button"
              onClick={() => document.getElementById(ROUTE_SECTION_ID)?.scrollIntoView()}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-bold text-white"
            >
              <Footprints className="size-5" aria-hidden="true" /> Find my exit route
            </button>
          )}
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

        {hasModel && <BuildingModel alertFloor={floorFromLocation(alert.building)} alertStair={stairFromInstruction(alert.instruction)} assembly={alert.assembly_point} closed={closedStairs} fire={fire} onPlaceChange={(level, area) => setPlace({ level, area })} />}
        {/engineering|administration|อำนวยการ/i.test(alert.building ?? "") && <SitePlan />}

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
        {!closed && !safe && help === "sent" && (
          <p role="status" className="rounded-xl bg-amber-400 p-3 text-sm font-bold leading-snug text-ink">
            Help request sent to security. Follow staff. If you can, call security.
          </p>
        )}
        {canAskHelp && help === "failed" && (
          <p role="alert" className="text-center text-sm font-semibold text-amber-300">
            Help request not sent. Call Campus Security now, or tap again.
          </p>
        )}
        {canAskHelp && help === "asking" && <HelpPlace place={place} onChange={setPlace} onSend={() => void sendHelp(place.level, place.area || null)} onCancel={() => setHelp("idle")} />}
        {closed ? (
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-slate-700 py-4 text-lg font-bold text-white">
            Close
          </button>
        ) : safe ? (
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-emerald-700 py-4 text-lg font-bold text-white">
            <CircleCheck className="size-6" aria-hidden="true" /> Marked safe. Close
          </button>
        ) : (
          <div className={canAskHelp && help !== "asking" ? "grid grid-cols-2 gap-2.5" : undefined}>
            <button type="button" onClick={tapSafe} disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-green-600 py-4 text-xl font-extrabold text-white disabled:opacity-70">
              <CircleCheck className="size-6 shrink-0" aria-hidden="true" /> {sending ? "Sending…" : canAskHelp ? "I'M SAFE" : "I'M SAFE (Acknowledge)"}
            </button>
            {canAskHelp && help !== "asking" && (
              <button type="button" onClick={tapHelp} disabled={help === "sending"} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-red-700 py-4 text-lg font-extrabold text-white disabled:opacity-70">
                <HandHelping className="size-6 shrink-0" aria-hidden="true" /> {help === "sending" ? "Sending…" : "NEED HELP"}
              </button>
            )}
          </div>
        )}
        <a href="tel:025644444" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-white py-3.5 font-bold text-brand">
          <Phone className="size-5" aria-hidden="true" /> Call Campus Security (02-564-4444)
        </a>
      </div>
    </div>
  );
}

type HelpPlaceProps = { place: { level: number | null; area: string }; onChange: (place: { level: number | null; area: string }) => void; onSend: () => void; onCancel: () => void };

/** Asked once when the route picker hasn't been used. Both can stay "Not sure": help must never wait on a form. */
function HelpPlace({ place, onChange, onSend, onCancel }: HelpPlaceProps) {
  const select = "h-11 min-w-0 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink";
  return (
    <div className="rounded-xl bg-white p-3 text-ink">
      <p className="font-bold">Where are you?</p>
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <select aria-label="Your level" value={place.level ?? ""} onChange={(event) => onChange({ level: event.target.value ? Number(event.target.value) : null, area: "" })} className={select}>
          <option value="">Level: not sure</option>
          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
            <option key={level} value={level}>
              Level {level}
            </option>
          ))}
        </select>
        <select aria-label="Your area" value={place.area} disabled={place.level === null} onChange={(event) => onChange({ ...place, area: event.target.value })} className={`${select} disabled:opacity-50`}>
          <option value="">Area: not sure</option>
          {place.level !== null &&
            areasOnLevel(place.level).map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
        </select>
      </div>
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-line px-4 font-semibold">
          Cancel
        </button>
        <button type="button" onClick={onSend} className="min-h-11 rounded-lg bg-red-700 font-bold text-white">
          Send help request
        </button>
      </div>
    </div>
  );
}

const SITE_PLAN = "/maps/engineering-site-plan.png";

const BUILDINGS = ["Administration Building", "Civil Engineering Lab", "Mechanical Engineering Lab", "Industrial Engineering Lab", "Laboratory and Research Building"];

// The faculty's real site plan. It shows where buildings are, not exits or routes inside them.
export function SitePlan() {
  return (
    <section className="rounded-2xl bg-white p-4 text-ink">
      <h3 className="mb-2 flex items-center gap-2 font-bold">
        <MapIcon className="size-5 text-brand" aria-hidden="true" /> Faculty of Engineering Site Plan
      </h3>
      <a href={SITE_PLAN} target="_blank" rel="noreferrer" aria-label="Open the site plan full size">
        <img src={SITE_PLAN} alt="Site plan of the Faculty of Engineering buildings at Thammasat Rangsit, with buildings 1 to 5 in red" className="w-full rounded-xl border border-line" />
      </a>
      <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">
        {BUILDINGS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
      <p className="mt-2 text-sm font-semibold">Shows buildings only, not exits. Follow exit signs and staff.</p>
      <p className="mt-1 text-xs text-muted">North is to the left. Tap to enlarge. Source: Faculty of Engineering Building and Vehicle Unit, 2013.</p>
    </section>
  );
}
