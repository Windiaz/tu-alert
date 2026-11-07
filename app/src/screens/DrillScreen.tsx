import type { ReactNode } from "react";
import { BellRing, Building2, CalendarDays, CircleCheck, Clock, Flag, Flame, Info, ShieldCheck, Users } from "lucide-react";
import { AppHeader, Card } from "../components/layout";
import { alertWhen, clockTime, type AlertRow } from "../lib/data";

export function DrillScreen({ alert, onDismiss }: { alert: AlertRow; onDismiss: () => void }) {
  return (
    <>
      <AppHeader />
      <div className="flex shrink-0 items-center gap-2 bg-navy px-5 py-2.5 text-sm font-bold tracking-wide text-white">
        <CalendarDays className="size-5" aria-hidden="true" />
        <span className="flex-1">SCHEDULED CAMPUS DRILL</span>
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs">
          <Info className="size-3.5" aria-hidden="true" /> ROUTINE
        </span>
      </div>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-xs font-bold text-navy">
              <span className="size-2 rounded-full bg-navy" /> NO HAZARD / EXERCISE
            </span>
            <span className="text-xs text-muted">Ref: {alert.code}</span>
          </div>
          <h2 className="mt-2 text-3xl leading-tight font-bold">SCHEDULED DRILL — NO HAZARD</h2>
          <p className="mt-1 text-sm text-muted">This is an orderly, planned safety procedure. Normal university operations are not disrupted.</p>
        </Card>

        <Card className="relative overflow-hidden">
          <span className="absolute inset-y-0 left-0 w-1.5 bg-navy" />
          <div className="divide-y divide-line px-5">
            <DrillRow icon={<Flame className="size-5" aria-hidden="true" />} label="DRILL TYPE">
              <span className="text-lg font-medium">{alert.title}</span>
            </DrillRow>
            <DrillRow icon={<Building2 className="size-5" aria-hidden="true" />} label="DESIGNATED AREA">
              {alert.building}
            </DrillRow>
            <DrillRow icon={<Clock className="size-5" aria-hidden="true" />} label="SCHEDULE / TIME WINDOW">
              <span className="text-lg font-semibold text-navy">{alertWhen(alert)}</span>
            </DrillRow>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line bg-tint/60 py-2.5 pr-4 pl-5 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 shrink-0 text-navy" aria-hidden="true" /> Authorized by {alert.confirmed_by ?? "Thammasat Safety Division"}
            </span>
            <span className="shrink-0">Broadcast {clockTime(alert.created_at)}</span>
          </div>
        </Card>

        <section className="rounded-2xl border border-line bg-tint p-4">
          <h3 className="flex items-center gap-2 text-lg leading-tight font-bold text-navy">
            <BellRing className="size-5 shrink-0" aria-hidden="true" /> NO ACTION NEEDED UNLESS INSTRUCTED
          </h3>
          {alert.instruction && <p className="mt-2 text-sm leading-relaxed">{alert.instruction}</p>}
        </section>

        {alert.assembly_point && (
          <Card className="flex items-center gap-3 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-navy">
              <Flag className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold">Assembly point</p>
              <p className="text-sm text-muted">{alert.assembly_point}</p>
            </div>
          </Card>
        )}

        <Card className="flex items-center gap-3 p-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-navy">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold">Follow Building Marshals</p>
            <p className="text-sm text-muted">Staff guide each floor during the drill.</p>
          </div>
        </Card>

        <button type="button" onClick={onDismiss} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 font-bold text-white">
          <CircleCheck className="size-5" aria-hidden="true" /> Understood / Dismiss
        </button>
      </main>
    </>
  );
}

function DrillRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3.5 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-tint text-navy">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="leading-snug">{children}</p>
      </div>
    </div>
  );
}
