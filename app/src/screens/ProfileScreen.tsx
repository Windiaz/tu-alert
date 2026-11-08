import { useState, type ReactNode } from "react";
import { BadgeCheck, Bell, CalendarDays, ClipboardCheck, Hammer, Info, Lock, RotateCcw, Siren, UserRound } from "lucide-react";
import { BackButton, Card } from "../components/layout";

const STORAGE_KEY = "tu-alert-tier2";
const DEFAULTS = { drills: true, status: true, digest: false };
type Prefs = typeof DEFAULTS;

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

type ProfileProps = { audience: boolean; onLeaveAudience: () => void; username: string | null; onRegister: () => void; onBack: () => void };

export function ProfileScreen({ audience, onLeaveAudience, username, onRegister, onBack }: ProfileProps) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  const update = (next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked. The toggle still works until the app closes.
    }
  };

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <BackButton onBack={onBack} />
        <h1 className="flex-1 truncate text-center text-xl font-bold">Notification Preferences</h1>
        <button type="button" onClick={() => update(DEFAULTS)} aria-label="Reset to defaults" className="grid size-10 place-items-center text-brand">
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="flex items-center gap-3 p-4">
          <UserRound className="size-6 shrink-0 text-brand" aria-hidden="true" />
          {audience ? (
            <>
              <p className="flex-1 font-semibold">Joined as audience: alerts only</p>
              <button type="button" onClick={onLeaveAudience} className="min-h-11 rounded-xl border border-line px-4 font-bold">
                Leave
              </button>
            </>
          ) : username ? (
            <p className="min-w-0 flex-1 truncate">
              Username: <span className="font-bold">{username}</span>
            </p>
          ) : (
            <>
              <p className="flex-1 font-semibold">No username yet</p>
              <button type="button" onClick={onRegister} className="min-h-11 rounded-xl bg-brand px-4 font-bold text-white">
                Choose one
              </button>
            </>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BadgeCheck className="size-6 text-brand" aria-hidden="true" /> Two-Tier Safety System
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">TU Alert separates life-threatening emergencies from facility updates so you never miss an urgent warning or suffer notification fatigue.</p>
        </Card>

        <TierTitle icon={<Siren className="size-4" aria-hidden="true" />} title="TIER 1: EMERGENCY DISPATCH" tone="text-brand">
          <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-brand">Mandatory</span>
        </TierTitle>

        <Card className="relative overflow-hidden border-red-200 p-4 pl-6">
          <span className="absolute inset-y-0 left-0 w-2 bg-alert" />
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="flex items-center gap-1.5 text-lg font-bold">
                Critical Alerts <Lock className="size-4" aria-hidden="true" />
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">Always on for verified campus emergencies (fires, natural disasters, active threats).</p>
            </div>
            <span role="switch" aria-checked="true" aria-disabled="true" aria-label="Critical Alerts, always on" className="flex h-8 w-14 shrink-0 items-center justify-end rounded-full bg-alert/80 p-1">
              <span className="grid size-6 place-items-center rounded-full bg-white text-alert">
                <Lock className="size-3" aria-hidden="true" />
              </span>
            </span>
          </div>
        </Card>

        <TierTitle icon={<Hammer className="size-4" aria-hidden="true" />} title="TIER 2: FACILITY & DRILL UPDATES" tone="text-amber-900">
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Customizable</span>
        </TierTitle>

        <Card className="divide-y divide-line">
          <ToggleRow icon={<Bell className="size-5" aria-hidden="true" />} title="Scheduled Drill Notices" text="Advance warnings 24h & 30m before scheduled alarms." on={prefs.drills} onChange={(drills) => update({ ...prefs, drills })} />
          <ToggleRow icon={<ClipboardCheck className="size-5" aria-hidden="true" />} title="Report Status Tracking" text="Updates when technicians acknowledge or resolve your submitted reports." on={prefs.status} onChange={(status) => update({ ...prefs, status })} />
          <ToggleRow icon={<CalendarDays className="size-5" aria-hidden="true" />} title="Weekly Campus Maintenance Digest" text="Scheduled closures of elevators, walkways, and power maintenance cycles." on={prefs.digest} onChange={(digest) => update({ ...prefs, digest })} />
        </Card>

        <p className="flex items-start gap-2 px-1 pb-2 text-xs font-medium text-muted">
          <Info className="size-4 shrink-0" aria-hidden="true" /> Alerts can't override silent mode or Do Not Disturb on iPhone. Check that your phone can ring during emergencies.
        </p>
      </main>
    </>
  );
}

function TierTitle({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: string; children: ReactNode }) {
  return (
    <div className={`flex items-center gap-1.5 px-1 text-xs font-bold ${tone}`}>
      {icon}
      <h2 className="flex-1">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({ icon, title, text, on, onChange }: { icon: ReactNode; title: string; text: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span className="mt-0.5 shrink-0 text-amber-900">{icon}</span>
      <div className="flex-1">
        <h3 className="text-lg leading-snug font-medium">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => onChange(!on)}
        className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 ${on ? "justify-end bg-alert" : "justify-start bg-indigo-100"}`}
      >
        <span className="size-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
