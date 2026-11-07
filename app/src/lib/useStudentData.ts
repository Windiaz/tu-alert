import { useCallback, useEffect, useRef, useState } from "react";
import { Queue, SList } from "../ds";
import {
  errorMessage,
  getDeviceId,
  isNetworkError,
  newCode,
  pendingToItem,
  sendAck,
  sendReport,
  toReportItem,
  type AlertRow,
  type NewReport,
  type PendingReport,
  type ReportRow,
} from "./data";
import { supabase } from "./supabase";

const REFRESH_MS = 10_000; // backup for when Realtime is blocked or the phone was asleep

export function useStudentData() {
  const [deviceId] = useState(getDeviceId);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [pending, setPending] = useState<PendingReport[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);

  // SF231: alert history is an SList, each new alert goes on top with addFirst, O(1).
  const alertList = useRef(new SList<AlertRow>());
  // SF231: the offline outbox is a Queue, so reports are sent in the order they were submitted.
  const outbox = useRef(new Queue<PendingReport>());
  const flushing = useRef(false);

  const refreshReports = useCallback(async () => {
    // Newest first, so insertion sort on Home finds the list almost sorted.
    const { data, error } = await supabase.from("reports").select("*").eq("device_id", deviceId).order("created_at", { ascending: false });
    if (!error && data) setRows(data as ReportRow[]);
  }, [deviceId]);

  const refreshAlerts = useCallback(async () => {
    const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: true });
    if (error || !data) return;
    const list = new SList<AlertRow>();
    for (const alert of data as AlertRow[]) list.addFirst(alert);
    alertList.current = list;
    setAlerts(list.toArray());
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    const queue = outbox.current;
    try {
      while (!queue.isEmpty()) {
        const next = queue.queueFront()!;
        try {
          await sendReport(next);
          await refreshReports();
        } catch (error) {
          if (isNetworkError(error)) break; // keep it queued and try again when back online
          setSendError(`Report ${next.code} could not be sent: ${errorMessage(error)}`);
        }
        queue.dequeue();
        setPending(queue.toArray());
      }
    } finally {
      flushing.current = false;
    }
  }, [refreshReports]);

  useEffect(() => {
    const refresh = () => {
      void refreshReports();
      void refreshAlerts();
      void flush();
    };
    refresh();

    const channel = supabase
      .channel(`student-${deviceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports", filter: `device_id=eq.${deviceId}` }, () => void refreshReports())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const alert = payload.new as AlertRow;
        if (alertList.current.toArray().some((a) => a.id === alert.id)) return;
        alertList.current.addFirst(alert);
        setAlerts(alertList.current.toArray());
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "alerts" }, () => void refreshAlerts())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh(); // catch anything sent while connecting
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);
    const timer = window.setInterval(refresh, REFRESH_MS);

    return () => {
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
      window.clearInterval(timer);
    };
  }, [deviceId, flush, refreshAlerts, refreshReports]);

  const submitReport = useCallback(
    (report: NewReport) => {
      outbox.current.enqueue({ ...report, id: crypto.randomUUID(), code: newCode("TU"), device_id: deviceId, createdAt: Date.now() });
      setPending(outbox.current.toArray());
      void flush();
    },
    [deviceId, flush],
  );

  const acknowledge = useCallback((alertId: string) => sendAck(alertId, deviceId), [deviceId]);

  const saved = rows.map(toReportItem);
  const waiting = pending.filter((p) => !rows.some((r) => r.id === p.id)).map(pendingToItem);

  return {
    deviceId,
    reports: [...waiting, ...saved],
    alerts,
    sendError,
    clearSendError: () => setSendError(null),
    submitReport,
    acknowledge,
  };
}
