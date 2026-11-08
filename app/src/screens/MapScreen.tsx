import { AppHeader } from "../components/layout";
import { BuildingModel } from "../components/BuildingModel";
import { SitePlan } from "./EmergencyScreen";

export function MapScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AppHeader onBack={onBack} />
      <main className="flex-1 space-y-3 overflow-y-auto p-4">
        <BuildingModel />
        <SitePlan />
      </main>
    </>
  );
}
