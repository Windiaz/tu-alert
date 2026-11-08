import { createContext, useContext, type ReactNode } from "react";
import { ArrowLeft, Building2, House, Megaphone, Shield, TriangleAlert, User } from "lucide-react";

export type Screen = "home" | "report" | "alerts" | "profile" | "emergency" | "drill" | "map";
export type TabId = "home" | "report" | "alerts" | "profile";

const TABS = [
  { id: "home", label: "Home", Icon: House },
  { id: "report", label: "Report", Icon: Megaphone },
  { id: "alerts", label: "Alerts", Icon: TriangleAlert },
  { id: "profile", label: "Profile", Icon: User },
] as const;

export function TabBar({ active, onSelect, hideReport = false }: { active: TabId; onSelect: (tab: TabId) => void; hideReport?: boolean }) {
  return (
    <nav
      aria-label="Main"
      className={`grid shrink-0 gap-2 border-t border-line bg-white px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] ${hideReport ? "grid-cols-3" : "grid-cols-4"}`}
    >
      {TABS.filter(({ id }) => !hideReport || id !== "report").map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            className={`mx-auto flex min-h-14 w-full max-w-20 flex-col items-center justify-center rounded-xl text-xs font-bold ${
              isActive ? "bg-brand text-white" : "text-ink/80"
            }`}
          >
            <Icon className="size-5" strokeWidth={2.2} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

/** Set where tapping the logo may leave the current screen. Not set on alert or signup screens. */
export const GoHomeContext = createContext<(() => void) | null>(null);

export function AppHeader({ onBack, right }: { onBack?: () => void; right?: ReactNode }) {
  const goHome = useContext(GoHomeContext);
  const brand = (
    <>
      {onBack ? (
        <Shield className="size-6 text-alert" strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <span className="grid size-10 place-items-center rounded-xl bg-alert text-white">
          <Shield className="size-5" strokeWidth={2.6} aria-hidden="true" />
        </span>
      )}
      TU Alert
    </>
  );
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b border-line bg-white px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
      {onBack && <BackButton onBack={onBack} />}
      <h1 className="shrink-0 text-2xl font-bold tracking-tight text-brand">
        {goHome ? (
          <button type="button" onClick={goHome} aria-label="TU Alert, go to Home" className="flex min-h-11 items-center gap-2.5">
            {brand}
          </button>
        ) : (
          <span className="flex items-center gap-2.5">{brand}</span>
        )}
      </h1>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {right ?? <Building2 className="size-6 text-brand" aria-hidden="true" />}
      </div>
    </header>
  );
}

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 grid size-10 place-items-center">
      <ArrowLeft className="size-6" aria-hidden="true" />
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>{children}</section>;
}
