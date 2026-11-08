import { useState } from "react";
import { Bell, Building2, CalendarDays, CheckCheck, ChevronRight, CircleCheck, ClipboardCheck, MapPin, Radio, ShieldCheck, Siren, type LucideIcon } from "lucide-react";
import { AlertIcon } from "../components/alertIcon";
import { AppHeader, Card } from "../components/layout";
import { alertWhen, clockTime, type AlertRow } from "../lib/data";

type Filter = "all" | "confirmed" | "drill";

export function AlertsScreen({ alerts, onOpen }: { alerts: AlertRow[]; onOpen: (alert: AlertRow) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? alerts.length : alerts.filter((a) => a.type === f).length);
  const tabs: [Filter, string, LucideIcon, string][] = [
    ["all", "All", Bell, "fill-amber-300 text-amber-700"],
    ["confirmed", "Confirmed", Siren, "fill-red-200 text-red-600"],
    ["drill", "Drills", ClipboardCheck, "fill-teal-200 text-teal-700"],
  ];

  return (
    <>
      <AppHeader
        right={
          <>
            <span className="rounded-md bg-tint px-2.5 py-1 text-sm font-medium">Rangsit</span>
            <Building2 className="size-6 text-alert" aria-hidden="true" />
          </>
        }
      />
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campus Alerts History</h2>
          <p className="mt-1 text-muted">Official broadcast log for Thammasat Rangsit University</p>
        </div>

        <div className="flex gap-3 rounded-2xl border border-line bg-tint p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/60 text-navy">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-navy">CHANNEL RELIABILITY NOTE</h3>
            <p className="mt-0.5 text-sm leading-snug">Critical alerts are broadcast only during active life-safety incidents or verified campus drills, after TU Security confirms them.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-tint p-1">
          {tabs.map(([f, label, Icon, color]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-sm font-semibold ${filter === f ? "bg-white shadow-sm" : "text-muted"}`}
            >
              <Icon className={`size-5 ${color}`} aria-hidden="true" />
              {label} ({count(f)})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {alerts
            .filter((a) => filter === "all" || a.type === filter)
            .map((a) => (a.type === "confirmed" ? <ConfirmedCard key={a.id} alert={a} onOpen={() => onOpen(a)} /> : <DrillCard key={a.id} alert={a} onOpen={() => onOpen(a)} />))}
          {alerts.length === 0 && <p className="py-6 text-center text-sm text-muted">No alerts yet.</p>}
        </div>

        <p className="pb-2 text-center text-xs font-medium text-muted">Items marked (Demo) are sample history.</p>
      </main>
    </>
  );
}

function ConfirmedCard({ alert: a, onOpen }: { alert: AlertRow; onOpen: () => void }) {
  return (
    <Card className="relative overflow-hidden p-4 pl-6">
      <span className="absolute inset-y-0 left-0 w-2 bg-alert" />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-alert">
          <span className="size-1.5 rounded-full bg-alert" /> CONFIRMED
        </span>
        <span className="text-sm text-muted">{alertWhen(a)}</span>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <AlertIcon title={a.title} type={a.type} />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug">{a.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4 shrink-0 text-alert" aria-hidden="true" /> {a.building}
          </p>
        </div>
      </div>
      <div className="mt-2.5 rounded-lg bg-tint p-2.5 text-sm">
        {a.instruction && <p className="leading-snug">{a.instruction}</p>}
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
          {a.status === "closed" ? (
            <>
              <CircleCheck className="size-3.5 text-emerald-600" aria-hidden="true" /> Incident closed
            </>
          ) : (
            <>
              <Radio className="size-3.5 text-alert" aria-hidden="true" /> Active{a.confirmed_at ? ` since ${clockTime(a.confirmed_at)}` : ""}
            </>
          )}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-sm font-semibold text-brand">
        <span>Code {a.code}</span>
        <button type="button" onClick={onOpen} className="flex items-center gap-1">
          View Alert <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

function DrillCard({ alert: a, onOpen }: { alert: AlertRow; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden rounded-2xl border border-line bg-white p-4 pl-6 text-left shadow-sm">
      <span className="absolute inset-y-0 left-0 w-2 bg-[#8f6f6f]" />
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          <span className="size-1.5 rounded-full bg-slate-500" /> DRILL
        </span>
        {a.status === "closed" ? (
          <span className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCheck className="size-3.5" aria-hidden="true" /> Completed
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-navy">
            <Radio className="size-3.5" aria-hidden="true" /> Active
          </span>
        )}
      </span>
      <span className="mt-2 flex items-start gap-3">
        <AlertIcon title={a.title} type={a.type} />
        <span className="min-w-0">
          <span className="block text-lg font-semibold leading-snug">{a.title}</span>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Building2 className="size-4 shrink-0" aria-hidden="true" /> {a.building}
          </span>
        </span>
      </span>
      <span className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2 text-sm text-muted">
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" /> {alertWhen(a)}
        <ChevronRight className="ml-auto size-4" aria-hidden="true" />
      </span>
    </button>
  );
}
