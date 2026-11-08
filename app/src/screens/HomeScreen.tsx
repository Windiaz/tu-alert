import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Camera,
  ChevronRight,
  Circle,
  CircleCheck,
  Clock,
  Map as MapIcon,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { CategoryTile } from "../components/categoryIcon";
import { AppHeader, Card } from "../components/layout";
import { byNewest, insertionSort } from "../ds";
import { timeAgo, type ReportItem, type Status } from "../lib/data";

const STATUS: Record<Status, { label: string; bar: string; badge: string; dot: string }> = {
  submitted: { label: "Submitted", bar: "bg-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "text-slate-400" },
  acknowledged: { label: "Acknowledged", bar: "bg-navy", badge: "bg-sky-50 text-navy border-sky-200", dot: "text-blue-500" },
  in_progress: { label: "In progress", bar: "bg-amber-400", badge: "bg-amber-50 text-amber-800 border-amber-300", dot: "text-amber-500" },
  resolved: { label: "Resolved", bar: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "text-emerald-500" },
};

const FILTERS: (Status | "all")[] = ["all", "in_progress", "acknowledged", "resolved", "submitted"];

type HomeProps = { audience: boolean; username: string | null; reports: ReportItem[]; activeAlerts: number; onReport: () => void; onMap: () => void };

export function HomeScreen({ audience, username, reports, activeAlerts, onReport, onMap }: HomeProps) {
  const [filter, setFilter] = useState<Status | "all">("all");
  // SF231: "My reports" is almost sorted already, so insertion sort is close to O(n).
  const sorted = insertionSort(reports, byNewest);
  const shown = sorted.filter((r) => filter === "all" || r.status === filter);
  const countOf = (f: Status | "all") => (f === "all" ? reports.length : reports.filter((r) => r.status === f).length);

  return (
    <>
      <AppHeader
        right={
          <span className="flex items-center gap-1.5 rounded-2xl border border-line bg-page px-2.5 py-1 text-xs leading-tight font-medium">
            <Building2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
            Thammasat Rangsit University
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          </span>
        }
      />
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        {username && <p className="truncate px-1 text-lg font-semibold">Hi, {username}</p>}
        <Card className="relative overflow-hidden p-4 pl-6">
          <span className={`absolute inset-y-0 left-0 w-2 ${activeAlerts ? "bg-alert" : "bg-emerald-500"}`} />
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span className={`size-3 rounded-full ring-4 ${activeAlerts ? "bg-alert ring-red-100" : "bg-emerald-500 ring-emerald-100"}`} />
                {activeAlerts ? "Thammasat Rangsit University: Alert active" : "Engineering Administration Building: All clear"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Last safety scan: 12 mins ago •{" "}
                <span className={`font-semibold ${activeAlerts ? "text-alert" : "text-emerald-700"}`}>
                  {activeAlerts} active {activeAlerts === 1 ? "alert" : "alerts"}
                </span>
              </p>
            </div>
            {activeAlerts ? (
              <TriangleAlert className="size-7 shrink-0 text-alert" aria-hidden="true" />
            ) : (
              <BadgeCheck className="size-7 shrink-0 text-emerald-600" aria-hidden="true" />
            )}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-sm">
            {[
              ["HVAC", "Optimal", ""],
              ["FIRE NODES", "48 Active", ""],
              ["EXITS", "All Clear", "text-emerald-700"],
            ].map(([term, value, tone]) => (
              <div key={term} className="rounded-xl border border-slate-100 bg-slate-50/60 px-1 py-2">
                <dt className="text-xs font-semibold text-muted">{term}</dt>
                <dd className={`font-medium ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-right text-[11px] text-muted">Demo data</p>
          <button type="button" onClick={onMap} className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl border border-line bg-white px-3 text-left font-semibold">
            <MapIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
            <span className="flex-1">Engineering building map</span>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
          </button>
        </Card>

        {audience ? (
          <p className="rounded-2xl border border-line bg-tint p-4 text-sm font-semibold">Keep this page open. Alerts appear here live.</p>
        ) : (
          <button
            type="button"
            onClick={onReport}
            className="flex w-full items-center gap-4 rounded-2xl bg-alert p-4 text-left text-white shadow-md"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-white/30 bg-white/15">
              <Wrench className="size-7" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-xl font-bold">
                Report an issue <Camera className="size-5" aria-hidden="true" />
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                <Timer className="size-3.5" aria-hidden="true" /> Takes about 10 seconds
              </span>
            </span>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-tint p-3">
          <PhoneCall className="size-5 shrink-0 text-alert" aria-hidden="true" />
          <span className="flex-1 text-sm font-semibold leading-tight">Emergency Line</span>
          <a href="tel:191" className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-alert">
            191
          </a>
          <a href="tel:025644444" className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-bold whitespace-nowrap">
            <ShieldCheck className="size-4 text-amber-700" aria-hidden="true" />
            02-564-4444
          </a>
        </div>

        {!audience && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <h2 className="text-xl font-bold">My reports</h2>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-brand">{reports.length} Total</span>
            </div>

            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {FILTERS.map((f) => {
                const active = f === filter;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                      active ? "border-ink bg-ink text-white" : "border-line bg-white"
                    }`}
                  >
                    {f !== "all" && <Circle className={`size-2 fill-current ${STATUS[f].dot}`} aria-hidden="true" />}
                    {f === "all" ? "All" : STATUS[f].label}
                    <span className="text-xs opacity-60">{countOf(f)}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {shown.map((r) => (
                <ReportCard key={r.code} report={r} />
              ))}
              {shown.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">{reports.length === 0 ? "No reports yet. Tap Report an issue to send one." : "No reports with this status."}</p>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function ReportCard({ report: r }: { report: ReportItem }) {
  const s = STATUS[r.status];
  return (
    <Card className="relative overflow-hidden p-4 pl-6">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} />
      <div className="flex items-start gap-3">
        <CategoryTile category={r.category} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted">{r.category}</p>
          <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>{s.label}</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="size-4 shrink-0" aria-hidden="true" /> {r.location}
      </p>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" /> {timeAgo(r.createdAt)}
        </span>
        {r.pending ? (
          <span className="flex items-center gap-1 text-amber-800">
            <Circle className="size-2 fill-current text-amber-500" aria-hidden="true" /> Waiting to send
          </span>
        ) : r.status === "resolved" ? (
          <span className="flex items-center gap-1 text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden="true" /> Work Verified
          </span>
        ) : r.status === "in_progress" ? (
          <span className="flex items-center gap-1 text-amber-800">
            <Circle className="size-2 fill-current text-amber-500" aria-hidden="true" /> Crew Dispatched
          </span>
        ) : (
          <span className="font-mono">ID: #{r.code}</span>
        )}
      </div>
    </Card>
  );
}
