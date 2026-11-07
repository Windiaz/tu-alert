// Sends a Web Push notification to every saved phone when an alert is created.
// It is public (the demo has no login), so it only takes an alert id, claims that alert once,
// and only posts to known push services. Calling it again sends nothing.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = "BFXutoLUHSaiQXmuLhdZt0-LcQ3OdyRCRSuKNN7b367Sagd0081mpOPMau6qFX0wqITnbj7Ye5Avn0yTohIAKpA";
const VAPID_SUBJECT = "https://tu-alert.vercel.app";
const PUSH_HOSTS = ["web.push.apple.com", "fcm.googleapis.com", "notify.windows.com", "push.services.mozilla.com"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const isPushService = (endpoint: string) => {
  try {
    const { protocol, hostname } = new URL(endpoint);
    return protocol === "https:" && PUSH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const { alert_id } = await req.json().catch(() => ({ alert_id: null }));
  if (typeof alert_id !== "string" || !/^[0-9a-f-]{36}$/i.test(alert_id)) return json({ error: "alert_id required" }, 400);

  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!privateKey) return json({ error: "VAPID_PRIVATE_KEY is not set" }, 500);
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Claim the alert: only the first call for an active alert gets a row back.
  const { data: alert, error: claimError } = await db
    .from("alerts")
    .update({ push_sent_at: new Date().toISOString() })
    .eq("id", alert_id)
    .eq("status", "active")
    .is("push_sent_at", null)
    .select("id, type, title, building, instruction")
    .maybeSingle();
  if (claimError) return json({ error: claimError.message }, 500);
  if (!alert) return json({ sent: 0, skipped: "already sent, closed or not found" });

  const { data: subscriptions, error: listError } = await db.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (listError) return json({ error: listError.message }, 500);

  const confirmed = alert.type === "confirmed";
  const payload = JSON.stringify({
    id: alert.id,
    title: confirmed ? "CONFIRMED INCIDENT — NOT A DRILL" : "Scheduled drill — no hazard",
    body: [alert.title, alert.building, alert.instruction].filter(Boolean).join(". "),
  });

  let sent = 0;
  const failures: string[] = [];
  const gone: string[] = [];
  await Promise.all(
    (subscriptions ?? []).map(async ({ endpoint, p256dh, auth }) => {
      if (!isPushService(endpoint)) {
        gone.push(endpoint);
        return;
      }
      try {
        await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload, {
          TTL: 3600,
          urgency: confirmed ? "high" : "normal",
        });
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(endpoint); // the phone unsubscribed
        else failures.push(`${new URL(endpoint).hostname}: ${status ?? (error as Error).message}`);
      }
    }),
  );
  if (gone.length) await db.from("push_subscriptions").delete().in("endpoint", gone);

  return json({ sent, removed: gone.length, failures });
});
