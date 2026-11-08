import { useEffect, useState, type ReactNode } from "react";
import { Building2, Camera, Clock, DoorOpen, Layers, Plus, Send, ShieldCheck, X, Zap } from "lucide-react";
import { CategoryTile } from "../components/categoryIcon";
import { AppHeader, Card } from "../components/layout";
import type { NewReport } from "../lib/data";

const CATEGORIES = [
  { name: "Electrical", label: "Electrical", hint: "Power, outlets" },
  { name: "Air conditioning", label: "Air Conditioning", hint: "HVAC, cold/hot" },
  { name: "Plumbing", label: "Plumbing", hint: "Leaks, drainage" },
  { name: "Safety hazard", label: "Safety Hazard", hint: "Urgent priority" },
  { name: "Cleanliness", label: "Cleanliness", hint: "Spills, trash" },
  { name: "Other", label: "Other", hint: "General fixes" },
];

const NOTE_MAX = 120;

export function ReportScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: (report: NewReport) => void }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const submit = () => {
    if (!category || !building.trim()) {
      setShowErrors(true);
      return;
    }
    onSubmit({ category, building: building.trim(), floor: floor.trim(), room: room.trim(), note: note.trim(), photo });
  };

  return (
    <>
      <AppHeader onBack={onBack} />
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-white px-5 pb-3">
        <div>
          <h2 className="text-2xl font-bold">Report an Issue</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Clock className="size-4" aria-hidden="true" /> Takes about 10 seconds
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-tint px-3 py-1 text-xs font-bold">
          <Zap className="size-3.5 text-alert" aria-hidden="true" /> Fast Track
        </span>
      </div>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="p-4">
          <StepTitle n={1} title="Photo Evidence">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">Recommended</span>
          </StepTitle>
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-red-200 p-3">
            <label className="grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg bg-tint text-brand">
              {preview ? (
                <img src={preview} alt="Selected report photo" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-[11px] font-bold">
                  <Camera className="size-7" aria-hidden="true" /> SNAP
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                aria-label="Take photo"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug">{photo ? "Photo attached" : "Take or attach photo"}</p>
                {photo ? (
                  <button type="button" onClick={() => setPhoto(null)} className="flex shrink-0 items-center gap-1 rounded-lg bg-tint px-2.5 py-1 text-sm font-medium">
                    <X className="size-4" aria-hidden="true" /> Remove
                  </button>
                ) : (
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-tint px-2.5 py-1 text-sm font-medium">
                    <Plus className="size-4" aria-hidden="true" /> Upload
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>
              <p className="mt-1 text-sm leading-snug text-muted">Photo helps technicians locate the issue faster</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <StepTitle n={2} title="Pick Category">
            <span className="text-xs font-bold text-alert">1 Required</span>
          </StepTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((c) => {
              const selected = category === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  aria-pressed={selected}
                  className={`relative flex min-h-20 items-center gap-2.5 rounded-xl border p-2.5 text-left ${
                    selected ? "border-2 border-alert bg-red-50" : "border-line bg-white"
                  }`}
                >
                  {selected && <span className="absolute top-2 right-2 size-2 rounded-full bg-alert" />}
                  <CategoryTile category={c.name} />
                  <span className="min-w-0">
                    <span className={`block font-semibold leading-tight ${selected ? "text-brand" : ""}`}>{c.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{c.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {showErrors && !category && <p className="mt-2 text-sm font-medium text-alert">Pick a category.</p>}
        </Card>

        <Card className="p-4">
          <StepTitle n={3} title="Location" />
          <Field label="Building" icon={<Building2 className="size-5" aria-hidden="true" />}>
            <input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Engineering Bldg 2" className="w-full bg-transparent outline-none" />
          </Field>
          {showErrors && !building.trim() && <p className="mt-1 text-sm font-medium text-alert">Enter the building.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Field label="Floor" icon={<Layers className="size-5" aria-hidden="true" />}>
              <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor 3" className="w-full min-w-0 bg-transparent outline-none" />
            </Field>
            <Field label="Room / Area" icon={<DoorOpen className="size-5" aria-hidden="true" />}>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Lab 304 / Hallway" className="w-full min-w-0 bg-transparent outline-none" />
            </Field>
          </div>
        </Card>

        <Card className="p-4">
          <label htmlFor="report-note" className="mb-2 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold">Short Note</span>
            <span className="text-xs text-muted">(Optional)</span>
            <span className="ml-auto text-xs font-bold text-muted">
              {note.length}/{NOTE_MAX} chars
            </span>
          </label>
          <input
            id="report-note"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Water dripping from ceiling unit"
            className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-alert"
          />
        </Card>

        <button type="button" onClick={submit} className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-alert py-4 text-lg font-bold text-white shadow-md">
          <Send className="size-5" aria-hidden="true" /> Submit Report
        </button>
        <p className="flex items-center justify-center gap-1.5 pb-2 text-sm text-muted">
          <ShieldCheck className="size-4 text-navy" aria-hidden="true" /> Sent directly to TU Facility Operations desk.
        </p>
      </main>
    </>
  );
}

function StepTitle({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-full bg-alert text-sm font-bold text-white">{n}</span>
      <h3 className="flex-1 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-muted">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-3 focus-within:border-alert">
        <span className="shrink-0 text-muted">{icon}</span>
        {children}
      </span>
    </label>
  );
}
