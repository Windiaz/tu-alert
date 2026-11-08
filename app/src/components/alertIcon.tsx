import { ClipboardCheck, CloudRain, Flame, PersonStanding, Siren, Volume2, type LucideIcon } from "lucide-react";

type Look = { Icon: LucideIcon; tile: string; color: string };

// Checked in this order, so "Fire Evacuation Practice" shows a flame.
const BY_TITLE: [RegExp, Look][] = [
  [/fire|smoke|burn/i, { Icon: Flame, tile: "bg-orange-100", color: "fill-orange-400 text-red-600" }],
  [/flood|weather|storm|rain/i, { Icon: CloudRain, tile: "bg-sky-100", color: "fill-sky-200 text-sky-700" }],
  [/\bPA\b|audio|sound/i, { Icon: Volume2, tile: "bg-violet-100", color: "fill-violet-300 text-violet-700" }],
  [/evacuat/i, { Icon: PersonStanding, tile: "bg-emerald-100", color: "text-emerald-700" }],
];

const BY_TYPE: Record<"confirmed" | "drill", Look> = {
  confirmed: { Icon: Siren, tile: "bg-red-100", color: "fill-red-200 text-red-600" },
  drill: { Icon: ClipboardCheck, tile: "bg-teal-100", color: "fill-teal-200 text-teal-700" },
};

export function AlertIcon({ title, type }: { title: string; type: "confirmed" | "drill" }) {
  const { Icon, tile, color } = BY_TITLE.find(([pattern]) => pattern.test(title))?.[1] ?? BY_TYPE[type];
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tile}`}>
      <Icon className={`size-6 ${color}`} aria-hidden="true" />
    </span>
  );
}
