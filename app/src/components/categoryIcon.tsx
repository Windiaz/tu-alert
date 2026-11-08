import { Droplets, Snowflake, Sparkles, TriangleAlert, Wrench, Zap, type LucideIcon } from "lucide-react";

type Look = { Icon: LucideIcon; tile: string; color: string };

const LOOKS: Record<string, Look> = {
  Electrical: { Icon: Zap, tile: "bg-amber-100", color: "fill-amber-300 text-amber-700" },
  "Air conditioning": { Icon: Snowflake, tile: "bg-sky-100", color: "text-sky-600" },
  Plumbing: { Icon: Droplets, tile: "bg-blue-100", color: "fill-blue-300 text-blue-700" },
  "Safety hazard": { Icon: TriangleAlert, tile: "bg-red-100", color: "fill-red-200 text-red-600" },
  Cleanliness: { Icon: Sparkles, tile: "bg-emerald-100", color: "fill-emerald-300 text-emerald-700" },
  Other: { Icon: Wrench, tile: "bg-violet-100", color: "fill-violet-300 text-violet-700" },
};

const lookOf = (category: string) => LOOKS[category] ?? LOOKS.Other;

/** Just the coloured icon, for tight spots like a label. */
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const { Icon, color } = lookOf(category);
  return <Icon className={`${className ?? ""} ${color}`} aria-hidden="true" />;
}

/** The coloured icon on its matching background. */
export function CategoryTile({ category }: { category: string }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${lookOf(category).tile}`}>
      <CategoryIcon category={category} className="size-5" />
    </span>
  );
}
