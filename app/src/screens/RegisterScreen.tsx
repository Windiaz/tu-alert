import { useState, type FormEvent } from "react";
import { UserRound } from "lucide-react";
import { AppHeader, Card } from "../components/layout";
import { registerUsername, USERNAME_RULE } from "../lib/data";

type Props = { deviceId: string; onDone: (username: string) => void; onSkip: () => void };

export function RegisterScreen({ deviceId, onDone, onSkip }: Props) {
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = username.trim();
    if (!USERNAME_RULE.test(name)) {
      setProblem("Use 3 to 20 letters or numbers. You can also use _ and . but no spaces.");
      return;
    }
    setSaving(true);
    setProblem(null);
    const failure = await registerUsername(name, deviceId);
    setSaving(false);
    if (failure) setProblem(failure);
    else onDone(name);
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 overflow-y-auto p-4">
        <Card className="p-5">
          <span className="grid size-12 place-items-center rounded-xl bg-red-50 text-brand">
            <UserRound className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-2xl font-bold">Choose a username</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Campus staff see it on your reports. No password needed. Use a nickname, not your student ID.</p>
          <form onSubmit={submit} className="mt-4">
            <label htmlFor="username" className="block text-sm font-semibold">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              aria-describedby={problem ? "username-problem" : undefined}
              className="mt-1 h-12 w-full rounded-xl border border-line px-3 text-base outline-none focus:border-alert"
            />
            {problem && (
              <p id="username-problem" role="alert" className="mt-2 text-sm font-semibold text-alert">
                {problem}
              </p>
            )}
            <button type="submit" disabled={saving} className="mt-4 h-12 w-full rounded-xl bg-brand font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Continue"}
            </button>
          </form>
          <button type="button" onClick={onSkip} className="mt-2 h-12 w-full rounded-xl font-semibold text-muted">
            Skip for now
          </button>
        </Card>
      </main>
    </>
  );
}
