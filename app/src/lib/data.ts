// Types and Supabase calls shared by the student app and the admin dashboard.
import type { Report } from "../ds";
import type { ClosedStair, FireOrigin } from "./buildingLayout";
import { supabase } from "./supabase";

export type Status = Report["status"];

export type ReportRow = {
  id: string;
  code: string;
  category: string;
  building: string;
  floor: string | null;
  room: string | null;
  note: string | null;
  photo_url: string | null;
  status: Status;
  device_id: string;
  reporter_name?: string | null;
  created_at: string;
};

export type AlertRow = {
  id: string;
  code: string;
  type: "confirmed" | "drill";
  title: string;
  building: string | null;
  instruction: string | null;
  assembly_point: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: "active" | "closed";
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  closed_stairs?: ClosedStair[];
  fire_origin?: FireOrigin | null;
};

export type AckRow = { alert_id: string; device_id: string };

export type HelpRow = { id: string; alert_id: string; device_id: string; name: string | null; level: number | null; area: string | null; created_at: string; handled_at: string | null };

export type ReportItem = Report & {
  id: string;
  title: string;
  location: string;
  note: string | null;
  photoUrl: string | null;
  reporter: string | null;
  pending?: boolean; // still waiting in the offline outbox
};

export type NewReport = { category: string; building: string; floor: string; room: string; note: string; photo: File | null };

export type PendingReport = NewReport & { id: string; code: string; device_id: string; reporter_name: string | null; createdAt: number };

export const STATUS_LABEL: Record<Status, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
};

// --- Browser storage. It can be blocked, so nothing here is allowed to throw. ---

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The app still works; it just forgets this after a reload.
  }
}

export function getDeviceId(): string {
  const existing = readStored("tu_device_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  writeStored("tu_device_id", id);
  return id;
}

// --- Audience mode: phones that joined from the class QR code get alerts only. ---

const AUDIENCE_KEY = "tu_audience";

/** Turns audience mode on when opened from the QR link, and removes the marker from the address. */
export function joinAudienceFromLink(): boolean {
  if (new URLSearchParams(window.location.search).get("join") === "1") {
    writeStored(AUDIENCE_KEY, "1");
    window.history.replaceState(null, "", window.location.pathname);
  }
  return readStored(AUDIENCE_KEY) === "1";
}

export const leaveAudience = () => writeStored(AUDIENCE_KEY, "0");

// --- Username. Demo only: there is no password, so a name doesn't prove who someone is. ---

export const USERNAME_RULE = /^[A-Za-z0-9_.ก-๙]{3,20}$/;

export const readUsername = () => readStored("tu_username");

/** Saves the name for this phone. Returns a message to show if it couldn't be saved. */
export async function registerUsername(username: string, deviceId: string): Promise<string | null> {
  const { error } = await supabase.from("usernames").insert({ device_id: deviceId, username });
  if (error?.code === "23505") {
    return error.message.includes("usernames_pkey") ? "This phone already has a username." : "That username is taken. Try another.";
  }
  if (error) return isNetworkError(error) ? "No connection. Check your internet and try again." : `Could not save: ${errorMessage(error)}`;
  writeStored("tu_username", username);
  return null;
}

// --- Formatting ---

const joinLocation = (building: string, floor?: string | null, room?: string | null) =>
  [building, floor, room].filter(Boolean).join(" - ");

const reportTitle = (note: string | null | undefined, category: string) => note || `${category} issue`;

export function toReportItem(row: ReportRow): ReportItem {
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    status: row.status,
    createdAt: Date.parse(row.created_at),
    title: reportTitle(row.note, row.category),
    location: joinLocation(row.building, row.floor, row.room),
    note: row.note,
    photoUrl: row.photo_url,
    reporter: row.reporter_name ?? null,
  };
}

export function pendingToItem(p: PendingReport): ReportItem {
  return {
    id: p.id,
    code: p.code,
    category: p.category,
    status: "submitted",
    createdAt: p.createdAt,
    title: reportTitle(p.note, p.category),
    location: joinLocation(p.building, p.floor, p.room),
    note: p.note || null,
    photoUrl: null,
    reporter: p.reporter_name,
    pending: true,
  };
}

export function timeAgo(createdAt: number, now = Date.now()): string {
  const minutes = Math.floor((now - createdAt) / 60000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export const clockTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function alertWhen(alert: AlertRow): string {
  const start = alert.starts_at ?? alert.created_at;
  const end = alert.ends_at ? ` - ${clockTime(alert.ends_at)}` : "";
  return `${shortDate(start)} • ${clockTime(start)}${end}`;
}

export const newCode = (prefix: string) => `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;

// --- Errors ---

type ErrorLike = { message?: string; code?: string };

export const errorMessage = (error: unknown) => (error as ErrorLike)?.message ?? "Unknown error";

// A network problem is worth retrying later. Anything else (rejected by the database) is not.
export function isNetworkError(error: unknown): boolean {
  return !navigator.onLine || /failed to fetch|load failed|network|timeout/i.test(errorMessage(error));
}

// --- Reports ---

// Phone photos are large and campus Wi-Fi is slow, so shrink before uploading.
async function shrinkPhoto(file: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function uploadPhoto(reportId: string, deviceId: string, photo: File): Promise<string> {
  const blob = await shrinkPhoto(photo);
  const extension = blob.type.split("/")[1] ?? "jpg";
  const path = `${deviceId}/${reportId}.${extension}`;
  const bucket = supabase.storage.from("report-photos");
  const { error } = await bucket.upload(path, blob, { contentType: blob.type });
  // "already exists" means an earlier try uploaded it before the connection dropped.
  if (error && !/exists|duplicate/i.test(error.message)) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

// Safe to call again for the same report: the id is fixed, so a retry can't create a second copy.
export async function sendReport(report: PendingReport): Promise<void> {
  const photo_url = report.photo ? await uploadPhoto(report.id, report.device_id, report.photo) : null;
  let code = report.code;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("reports").insert({
      id: report.id,
      code,
      category: report.category,
      building: report.building,
      floor: report.floor || null,
      room: report.room || null,
      note: report.note || null,
      photo_url,
      device_id: report.device_id,
      reporter_name: report.reporter_name,
    });
    if (!error) return;
    if (error.code !== "23505") throw error;
    if (error.message.includes("reports_pkey")) return; // an earlier try already saved it
    code = newCode("TU"); // the ticket code was taken: pick another
  }
  throw new Error("Could not create a unique ticket code");
}

// --- Alerts ---

// Returns true when the tap is saved. A second tap from the same phone also counts as saved.
export async function sendAck(alertId: string, deviceId: string): Promise<boolean> {
  const { error } = await supabase.from("acks").insert({ alert_id: alertId, device_id: deviceId });
  return !error || error.code === "23505";
}

// Returns true when saved. Asking again from the same phone reopens the request with the latest place.
export async function sendHelp(alertId: string, deviceId: string, name: string | null, level: number | null, area: string | null): Promise<boolean> {
  const { error } = await supabase.from("help_requests").insert({ alert_id: alertId, device_id: deviceId, name, level, area });
  if (!error) return true;
  if (error.code !== "23505") return false;
  const { error: failed } = await supabase.from("help_requests").update({ level, area, handled_at: null }).eq("alert_id", alertId).eq("device_id", deviceId);
  return !failed;
}
