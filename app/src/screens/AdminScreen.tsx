import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronRight, ImageIcon, Search, Send, Shield, Undo2, Users } from "lucide-react";
import { byPriorityThenNewest, HashMap, mergeSort, Queue, Stack } from "../ds";
import {
  errorMessage,
  newCode,
  STATUS_LABEL,
  timeAgo,
  toReportItem,
  type AckRow,
  type AlertRow,
  type ReportItem,
  type ReportRow,
  type Status,
} from "../lib/data";
import { supabase } from "../lib/supabase";

const REFRESH_MS = 10_000; // backup for when Realtime is blocked
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const PIN_KEY = "tu_admin_ok";

export function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(PIN_KEY) === "1";
    } catch {
      return false;
    }
  });
  if (unlocked) return <Dashboard />;
  return (
    <PinGate
      onUnlock={() => {
        try {
          sessionStorage.setItem(PIN_KEY, "1");
        } catch {
          // Asks for the PIN again after a reload.
        }
        setUnlocked(true);
      }}
    />
  );
}

// A simple demo gate. The PIN ships inside the page code, so it is not real security.
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pin === import.meta.env.VITE_ADMIN_PIN) onUnlock();
    else setWrong(true);
  };
  return (
    <main className="grid h-dvh place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-xs rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold text-brand">
          <Shield className="size-6" aria-hidden="true" /> TU Alert Admin
        </h1>
        <label htmlFor="admin-pin" className="mt-4 block text-sm font-semibold">
          PIN
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 outline-none focus:border-alert"
        />
        {wrong && <p className="mt-2 text-sm font-medium text-alert">Wrong PIN.</p>}
        <button type="submit" className="mt-4 w-full rounded-xl bg-brand py-2.5 font-bold text-white">
          Open dashboard
        </button>
      </form>
    </main>
  );
}

type StatusChange = { id: string; code: string; from: Status; to: Status };

function Dashboard() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertRow[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [handling, setHandling] = useState<string | null>(null);
  const [, redraw] = useState(0);

  // SF231: Undo is a Stack. Each status change is pushed, Undo pops the latest one.
  const undoStack = useRef(new Stack<StatusChange>());
  // SF231: "I'm safe" counter. Outer key = alert id, inner key = device id, so each phone counts once.
  const acks = useRef(new HashMap<HashMap<boolean>>());

  const addAck = (ack: AckRow) => {
    let devices = acks.current.get(ack.alert_id);
    if (!devices) {
      devices = new HashMap<boolean>();
      acks.current.put(ack.alert_id, devices);
    }
    devices.put(ack.device_id, true);
  };

  const refreshReports = useCallback(async () => {
    const { data, error: failed } = await supabase.from("reports").select("*").order("created_at", { ascending: true });
    if (!failed && data) setReports((data as ReportRow[]).map(toReportItem));
  }, []);

  const refreshAlerts = useCallback(async () => {
    const [alertsResult, acksResult] = await Promise.all([
      supabase.from("alerts").select("*").eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("acks").select("alert_id, device_id"),
    ]);
    if (alertsResult.data) setActiveAlerts(alertsResult.data as AlertRow[]);
    if (acksResult.data) {
      acks.current = new HashMap<HashMap<boolean>>();
      (acksResult.data as AckRow[]).forEach(addAck);
      redraw((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      void refreshReports();
      void refreshAlerts();
    };
    refresh();
    const channel = supabase
      .channel("admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => void refreshReports())
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => void refreshAlerts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "acks" }, (payload) => {
        addAck(payload.new as AckRow);
        redraw((n) => n + 1);
      })
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") refresh();
      });
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener("online", refresh);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(timer);
      window.removeEventListener("online", refresh);
    };
  }, [refreshAlerts, refreshReports]);

  // SF231: merge sort, O(n log n): safety hazards first, then newest first.
  const sorted = useMemo(() => mergeSort(reports, byPriorityThenNewest), [reports]);

  // SF231: FIFO queue of reports nobody has looked at yet. `reports` is oldest first.
  const queue = useMemo(() => {
    const waiting = new Queue<ReportItem>();
    for (const report of reports) if (report.status === "submitted") waiting.enqueue(report);
    return waiting;
  }, [reports]);

  // SF231: find a report by ticket code in O(1) on average.
  const byCode = useMemo(() => {
    const map = new HashMap<ReportItem>();
    for (const report of reports) map.put(report.code, report);
    return map;
  }, [reports]);

  const search = query.trim().toUpperCase().replace(/^#/, "");
  const found = search ? byCode.get(/^\d+$/.test(search) ? `TU-${search}` : search) : undefined;

  const applyStatus = async (report: ReportItem, to: Status): Promise<boolean> => {
    const from = report.status;
    setError(null);
    setReports((all) => all.map((r) => (r.id === report.id ? { ...r, status: to } : r)));
    const { data, error: failed } = await supabase.from("reports").update({ status: to }).eq("id", report.id).select("id");
    if (failed || !data?.length) {
      setReports((all) => all.map((r) => (r.id === report.id ? { ...r, status: from } : r)));
      setError(`Could not update ${report.code}: ${failed ? errorMessage(failed) : "report not found"}`);
      return false;
    }
    return true;
  };

  const changeStatus = async (report: ReportItem, to: Status) => {
    if (report.status === to) return;
    const change = { id: report.id, code: report.code, from: report.status, to };
    if (await applyStatus(report, to)) {
      undoStack.current.push(change);
      redraw((n) => n + 1);
    }
  };

  const handleNext = () => {
    if (queue.isEmpty()) return;
    const next = queue.dequeue();
    setHandling(next.code);
    void changeStatus(next, "acknowledged");
  };

  const undo = async () => {
    if (undoStack.current.isEmpty()) return;
    const last = undoStack.current.pop();
    redraw((n) => n + 1);
    const report = reports.find((r) => r.id === last.id);
    if (!report || !(await applyStatus(report, last.from))) {
      undoStack.current.push(last);
      redraw((n) => n + 1);
    }
  };

  const closeAlert = async (alert: AlertRow) => {
    const { error: failed } = await supabase.from("alerts").update({ status: "closed" }).eq("id", alert.id);
    if (failed) setError(`Could not close ${alert.code}: ${errorMessage(failed)}`);
    else setActiveAlerts((all) => all.filter((a) => a.id !== alert.id));
  };

  const lastChange = undoStack.current.peek();
  const nextUp = queue.queueFront();

  return (
    <div className="h-dvh overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-6 py-3">
        <Shield className="size-6 text-brand" aria-hidden="true" />
        <h1 className="text-xl font-bold text-brand">TU Alert Admin</h1>
        <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-muted">
          <span className={`size-2 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
          {live ? "Live" : "Connecting: refreshing every 10 s"}
        </span>
      </header>

      {error && (
        <p role="alert" className="bg-red-100 px-6 py-2 text-sm font-medium text-brand">
          {error}
        </p>
      )}

      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Reports" className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-48 flex-1">
                <h2 className="text-lg font-bold">Report queue</h2>
                <p className="text-sm text-muted">
                  {nextUp ? `${queue.size()} waiting. Next up: ${nextUp.code} (oldest first)` : "Nothing waiting."}
                </p>
              </div>
              <button type="button" onClick={handleNext} disabled={!nextUp} className="flex items-center gap-1 rounded-xl bg-brand px-4 py-2.5 font-bold text-white disabled:opacity-40">
                Handle next <ChevronRight className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={undo} disabled={!lastChange} className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 font-semibold disabled:opacity-40">
                <Undo2 className="size-4" aria-hidden="true" />
                {lastChange ? `Undo ${lastChange.code}: ${STATUS_LABEL[lastChange.to]}` : "Undo last status change"}
              </button>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-line px-3 py-2 focus-within:border-alert">
              <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="sr-only">Find report by ticket code</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by ticket code, e.g. TU-8842" className="w-full bg-transparent outline-none" />
            </label>
            {search && (
              <div className="mt-3">
                {found ? <ReportRowCard report={found} highlight onStatus={changeStatus} /> : <p className="text-sm text-muted">No report with code {search}.</p>}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sorted.map((report) => (
              <ReportRowCard key={report.id} report={report} highlight={report.code === handling} onStatus={changeStatus} />
            ))}
            {sorted.length === 0 && <p className="rounded-2xl border border-line bg-white p-6 text-center text-muted">No reports yet. New ones appear here live.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <section aria-label="Active alerts" className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold">Active alerts</h2>
            <div className="mt-2 space-y-2">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className={`rounded-xl border p-3 ${alert.type === "confirmed" ? "border-red-200 bg-red-50" : "border-sky-200 bg-sky-50"}`}>
                  <p className="text-xs font-bold">
                    {alert.type === "confirmed" ? "CONFIRMED INCIDENT" : "SCHEDULED DRILL"} • {alert.code}
                  </p>
                  <p className="font-semibold">{alert.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-2xl font-extrabold text-emerald-700" aria-live="polite">
                      <Users className="size-5" aria-hidden="true" /> {acks.current.get(alert.id)?.size() ?? 0} safe
                    </span>
                    <button type="button" onClick={() => closeAlert(alert)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold">
                      Close alert
                    </button>
                  </div>
                </div>
              ))}
              {activeAlerts.length === 0 && <p className="text-sm text-muted">None right now.</p>}
            </div>
          </section>

          <NewAlertForm onError={setError} onSent={(alert) => setActiveAlerts((all) => (all.some((a) => a.id === alert.id) ? all : [alert, ...all]))} />
        </aside>
      </div>
    </div>
  );
}

function ReportRowCard({ report: r, highlight, onStatus }: { report: ReportItem; highlight: boolean; onStatus: (report: ReportItem, to: Status) => void }) {
  const hazard = r.category === "Safety hazard";
  return (
    <article className={`flex gap-3 rounded-2xl border bg-white p-3 shadow-sm ${highlight ? "border-2 border-brand" : "border-line"}`}>
      {r.photoUrl ? (
        <a href={r.photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
          <img src={r.photoUrl} alt={`Photo for ${r.code}`} className="size-20 rounded-xl object-cover" />
        </a>
      ) : (
        <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-tint text-muted">
          <ImageIcon className="size-6" aria-label="No photo" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">{r.code}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${hazard ? "bg-red-100 text-alert" : "bg-tint"}`}>{r.category}</span>
          <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
        </div>
        <p className="mt-1 truncate font-medium">{r.location}</p>
        {r.note && <p className="truncate text-sm text-muted">{r.note}</p>}
      </div>
      <label className="shrink-0 self-center">
        <span className="sr-only">Status of {r.code}</span>
        <select value={r.status} onChange={(e) => onStatus(r, e.target.value as Status)} className="rounded-xl border border-line bg-white px-2 py-2 text-sm font-semibold">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

type AlertType = AlertRow["type"];

const ALERT_DEFAULTS: Record<AlertType, { title: string; building: string; instruction: string; assembly: string; by: string }> = {
  confirmed: {
    title: "Active Fire Alert",
    building: "Engineering Building 2, Floor 3",
    instruction: "Evacuate immediately via East Stairwell. Do NOT use elevators.",
    assembly: "Sunken Garden Zone B",
    by: "TU Security Center",
  },
  drill: {
    title: "Annual Fire Evacuation Practice",
    building: "Engineering Building 2 & SC3 Lecture Halls",
    instruction: "Alarms may sound during the drill. Classes may continue unless your building marshal asks you to take part.",
    assembly: "Faculty Lawn, SC3 North Courtyard",
    by: "Thammasat Safety Division",
  },
};

const timeInput = (date: Date) => date.toTimeString().slice(0, 5);
const todayAt = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

function NewAlertForm({ onSent, onError }: { onSent: (alert: AlertRow) => void; onError: (message: string | null) => void }) {
  const [type, setType] = useState<AlertType>("confirmed");
  const [fields, setFields] = useState(ALERT_DEFAULTS.confirmed);
  const [start, setStart] = useState(() => timeInput(new Date()));
  const [end, setEnd] = useState(() => timeInput(new Date(Date.now() + 45 * 60000)));
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  const pickType = (next: AlertType) => {
    setType(next);
    setFields(ALERT_DEFAULTS[next]);
    setConfirming(false);
  };

  const send = async () => {
    setSending(true);
    onError(null);
    const isDrill = type === "drill";
    const { data, error } = await supabase
      .from("alerts")
      .insert({
        code: newCode(isDrill ? "DRILL" : "INC"),
        type,
        title: fields.title.trim(),
        building: fields.building.trim(),
        instruction: fields.instruction.trim() || null,
        assembly_point: fields.assembly.trim() || null,
        starts_at: isDrill ? todayAt(start) : null,
        ends_at: isDrill ? todayAt(end) : null,
        confirmed_by: fields.by.trim() || null,
        confirmed_at: isDrill ? null : new Date().toISOString(),
      })
      .select()
      .single();
    setSending(false);
    setConfirming(false);
    if (error) {
      onError(`Alert not sent: ${errorMessage(error)}`);
      return;
    }
    const alert = data as AlertRow;
    onSent(alert);
    // Open phones already have it through Realtime. This reaches phones with the app closed.
    const push = await supabase.functions.invoke("send-alert-push", { body: { alert_id: alert.id } });
    const failures: string[] = push.data?.failures ?? [];
    if (push.error) onError(`Alert sent to open apps, but notifications failed: ${errorMessage(push.error)}`);
    else if (failures.length) onError(`Alert sent, but ${failures.length} notification(s) failed: ${failures[0]}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (type === "confirmed") setConfirming(true);
    else void send();
  };

  return (
    <form onSubmit={submit} aria-label="New alert" className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold">New alert</h2>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-tint p-1">
        {(["confirmed", "drill"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => pickType(option)}
            aria-pressed={type === option}
            className={`rounded-lg py-2 text-sm font-semibold ${type === option ? (option === "confirmed" ? "bg-alert text-white" : "bg-navy text-white") : "text-muted"}`}
          >
            {option === "confirmed" ? "Confirmed incident" : "Scheduled drill"}
          </button>
        ))}
      </div>
      <FormField label="Title">
        <input required value={fields.title} onChange={(e) => set("title")(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Building / area">
        <input required value={fields.building} onChange={(e) => set("building")(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Instruction">
        <textarea rows={2} value={fields.instruction} onChange={(e) => set("instruction")(e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Assembly point">
        <input value={fields.assembly} onChange={(e) => set("assembly")(e.target.value)} className={inputClass} />
      </FormField>
      {type === "drill" && (
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Starts today at">
            <input type="time" required value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Ends today at">
            <input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </FormField>
        </div>
      )}
      <FormField label={type === "confirmed" ? "Verified by" : "Authorized by"}>
        <input required value={fields.by} onChange={(e) => set("by")(e.target.value)} className={inputClass} />
      </FormField>
      <p className="text-xs text-muted">Sample text is filled in for the demo. Sending goes to every open phone.</p>

      {confirming ? (
        <div role="alertdialog" aria-label="Confirm incident" className="rounded-xl border-2 border-alert bg-red-50 p-3">
          <p className="font-bold text-alert">Confirm this is real?</p>
          <p className="text-sm">Every phone will show the red full-screen alert.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="rounded-xl border border-line bg-white py-2.5 font-semibold">
              Cancel
            </button>
            <button type="button" onClick={send} disabled={sending} className="rounded-xl bg-alert py-2.5 font-bold text-white disabled:opacity-60">
              {sending ? "Sending…" : "Yes, send it"}
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" disabled={sending} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60 ${type === "confirmed" ? "bg-alert" : "bg-navy"}`}>
          <Send className="size-4" aria-hidden="true" /> {sending ? "Sending…" : "Send"}
        </button>
      )}
    </form>
  );
}

const inputClass = "mt-1 w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-alert";

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold text-muted">
      {label}
      <span className="block text-base font-normal text-ink">{children}</span>
    </label>
  );
}
