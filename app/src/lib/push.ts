// Web Push: alerts reach the phone while the app is closed.
// On iPhone this needs iOS 16.4+, the app added to the Home Screen, and a tap to ask permission.
import { supabase } from "./supabase";

export type PushState = "unsupported" | "needs_install" | "denied" | "off" | "on";

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64url.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function saveSubscription(subscription: PushSubscription, deviceId: string): Promise<void> {
  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").insert({ endpoint, p256dh: keys?.p256dh, auth: keys?.auth, device_id: deviceId });
  if (error && error.code !== "23505") throw error; // 23505: this phone is already saved
}

export async function getPushState(deviceId: string): Promise<PushState> {
  // Safari on iPhone only offers push after Add to Home Screen.
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return isIos() ? "needs_install" : "unsupported";
  if (!PUBLIC_KEY) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "off";
  await saveSubscription(subscription, deviceId).catch(() => {}); // retried on the next open
  return "on";
}

// Must start from a tap: iPhone refuses the permission prompt otherwise.
export async function enablePush(deviceId: string): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY!) });
  await saveSubscription(subscription, deviceId);
  return "on";
}
