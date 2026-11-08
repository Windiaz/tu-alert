import { useEffect, useRef, useState } from "react";
import { BellRing, Share, Volume2, X } from "lucide-react";
import { GoHomeContext, TabBar, type Screen, type TabId } from "./components/layout";
import { Stack } from "./ds";
import { errorMessage, joinAudienceFromLink, leaveAudience, readStored, readUsername, writeStored, type AlertRow, type NewReport } from "./lib/data";
import { enablePush, getPushState, type PushState } from "./lib/push";
import { audioReady, playChime, playSiren, unlockAudio } from "./lib/sound";
import { useStudentData } from "./lib/useStudentData";
import { AlertsScreen } from "./screens/AlertsScreen";
import { DrillScreen } from "./screens/DrillScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { ReportScreen } from "./screens/ReportScreen";

const SEEN_KEY = "tu_seen_alerts";

function readSeen(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStored(SEEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const { deviceId, reports, alerts, sendError, clearSendError, submitReport, acknowledge, askHelp } = useStudentData();
  const [screen, setScreen] = useState<Screen>("home");
  const [viewing, setViewing] = useState<AlertRow | null>(null);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const [soundOn, setSoundOn] = useState(false);
  const [quietAlert, setQuietAlert] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>("unsupported");
  const [pushError, setPushError] = useState<string | null>(null);
  const [hintClosed, setHintClosed] = useState(() => readStored("tu_push_hint_closed") === "1");
  const [username, setUsername] = useState(readUsername);
  const [audience, setAudience] = useState(joinAudienceFromLink);
  const [signupOpen, setSignupOpen] = useState(() => !audience && !readUsername() && readStored("tu_signup_skipped") !== "1");
  // SF231: screen history is a Stack. Opening a screen pushes, Back pops (Last-In First-Out).
  const history = useRef(new Stack<Screen>());

  const go = (next: Screen) => {
    if (next === screen) return;
    history.current.push(screen);
    setScreen(next);
  };
  const back = () => setScreen(history.current.isEmpty() ? "home" : history.current.pop());

  const addReport = (report: NewReport) => {
    submitReport(report);
    go("home");
  };

  const openAlert = (alert: AlertRow) => {
    setViewing(alert);
    go(alert.type === "confirmed" ? "emergency" : "drill");
  };

  const markSeen = (id: string) => {
    const next = [...seen, id];
    setSeen(next);
    writeStored(SEEN_KEY, JSON.stringify(next));
  };

  // An active alert this phone hasn't dismissed takes over the screen. Confirmed incidents come first.
  const unseen = alerts.filter((a) => a.status === "active" && !seen.includes(a.id));
  const takeover = unseen.find((a) => a.type === "confirmed") ?? unseen[0] ?? null;
  const takeoverId = takeover?.id;
  const takeoverType = takeover?.type;

  const silenced = takeoverId !== undefined && takeoverId === quietAlert;

  // Also starts when sound gets unlocked during an alert. Stops once the student has responded.
  useEffect(() => {
    if (!takeoverId || !soundOn || silenced) return;
    return takeoverType === "confirmed" ? playSiren() : playChime();
  }, [takeoverId, takeoverType, soundOn, silenced]);

  // Any tap unlocks sound. Coming back from the background can lock it again.
  useEffect(() => {
    const unlock = () => {
      if (!audioReady()) void unlockAudio().then(setSoundOn);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void unlockAudio().then(setSoundOn);
      void getPushState(deviceId).then(setPushState).catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    document.addEventListener("visibilitychange", onVisible);
    void getPushState(deviceId).then(setPushState).catch(() => {});
    return () => {
      window.removeEventListener("pointerdown", unlock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deviceId]);

  const turnOnAlerts = async () => {
    void unlockAudio().then((ready) => {
      setSoundOn(ready);
      playChime();
    });
    if (pushState !== "off") return;
    setPushError(null);
    try {
      setPushState(await enablePush(deviceId));
    } catch (error) {
      setPushError(`Notifications could not be turned on: ${errorMessage(error)}`);
    }
  };

  const closeHint = () => {
    setHintClosed(true);
    writeStored("tu_push_hint_closed", "1");
  };

  const safeTapped = (alertId: string) => {
    setQuietAlert(alertId);
    return acknowledge(alertId);
  };

  const activeTab: TabId = screen === "drill" || screen === "emergency" ? "alerts" : screen === "map" ? "home" : screen;
  const shell = "mx-auto flex h-dvh max-w-[480px] flex-col bg-page shadow-sm";

  if (takeover?.type === "confirmed") {
    return (
      <div className={shell}>
        <EmergencyScreen
          key={takeover.id}
          alert={takeover}
          soundOff={!soundOn}
          onSafe={() => safeTapped(takeover.id)}
          onHelp={audience ? undefined : (level, area) => askHelp(takeover.id, level, area)}
          onClose={() => markSeen(takeover.id)}
        />
      </div>
    );
  }
  if (takeover) {
    return (
      <div className={shell}>
        <DrillScreen key={takeover.id} alert={takeover} onDismiss={() => markSeen(takeover.id)} />
      </div>
    );
  }

  // After the alert checks above, so signing up can never hide an emergency.
  if (signupOpen) {
    return (
      <div className={shell}>
        <RegisterScreen
          deviceId={deviceId}
          onDone={(name) => {
            setUsername(name);
            setSignupOpen(false);
          }}
          onSkip={() => {
            writeStored("tu_signup_skipped", "1");
            setSignupOpen(false);
          }}
        />
      </div>
    );
  }

  // The list refreshes while an alert is open, so show its latest status.
  const current = viewing && (alerts.find((a) => a.id === viewing.id) ?? viewing);

  return (
    <div className={shell}>
      {screen === "emergency" && current ? (
        <EmergencyScreen
          key={current.id}
          alert={current}
          onSafe={() => acknowledge(current.id)}
          onHelp={audience ? undefined : (level, area) => askHelp(current.id, level, area)}
          onClose={back}
        />
      ) : (
        <>
          {pushState === "off" ? (
            <button
              type="button"
              onClick={turnOnAlerts}
              className="flex shrink-0 items-center justify-center gap-2 bg-navy px-4 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2.5 text-sm font-bold text-white"
            >
              <BellRing className="size-4" aria-hidden="true" /> Turn on alerts: sound and notifications
            </button>
          ) : (
            !soundOn && (
              <button
                type="button"
                onClick={turnOnAlerts}
                className="flex shrink-0 items-center justify-center gap-2 bg-navy px-4 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2.5 text-sm font-bold text-white"
              >
                <Volume2 className="size-4" aria-hidden="true" /> Tap to turn on alert sound
              </button>
            )
          )}
          {(pushState === "needs_install" || pushState === "denied") && !hintClosed && (
            <div className="flex shrink-0 items-center gap-2 bg-tint px-4 py-2 text-sm font-medium">
              <Share className="size-4 shrink-0 text-navy" aria-hidden="true" />
              <span className="flex-1">
                {pushState === "needs_install"
                  ? "To get alerts while the app is closed, tap Share, then Add to Home Screen, and open it from there."
                  : "Notifications are blocked. Allow TU Alert in iPhone Settings to get alerts while the app is closed."}
              </span>
              <button type="button" onClick={closeHint} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {pushError && (
            <p role="alert" className="shrink-0 bg-red-100 px-4 py-2 text-sm font-medium text-brand">
              {pushError}
            </p>
          )}
          {sendError && (
            <div role="alert" className="flex shrink-0 items-center gap-2 bg-red-100 px-4 py-2 text-sm font-medium text-brand">
              <span className="flex-1">{sendError}</span>
              <button type="button" onClick={clearSendError} aria-label="Dismiss" className="grid size-8 place-items-center">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <GoHomeContext.Provider value={() => go("home")}>
            {screen === "home" && <HomeScreen audience={audience} username={username} reports={reports} activeAlerts={alerts.filter((a) => a.status === "active").length} onReport={() => go("report")} onMap={() => go("map")} />}
            {screen === "map" && <MapScreen onBack={back} />}
            {screen === "report" && <ReportScreen onBack={back} onSubmit={addReport} />}
            {screen === "alerts" && <AlertsScreen alerts={alerts} onOpen={openAlert} />}
          </GoHomeContext.Provider>
          {screen === "drill" && current && <DrillScreen key={current.id} alert={current} onDismiss={back} />}
          {screen === "profile" && (
            <ProfileScreen
              audience={audience}
              onLeaveAudience={() => {
                leaveAudience();
                setAudience(false);
              }}
              username={username}
              onRegister={() => setSignupOpen(true)}
              onBack={back}
            />
          )}
          <TabBar active={activeTab} onSelect={go} hideReport={audience} />
        </>
      )}
    </div>
  );
}
