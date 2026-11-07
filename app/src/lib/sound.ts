// Safari blocks sound until the user taps, on every open, and can suspend it in the background.
// Web apps can't play through silent mode on iPhone.
let context: AudioContext | null = null;

export const audioReady = () => context?.state === "running";

// Call from a tap. Resolves true when sound can play.
export async function unlockAudio(): Promise<boolean> {
  try {
    context ??= new AudioContext();
    await context.resume();
    return audioReady();
  } catch {
    return false; // No sound on this browser. Alerts still show on screen.
  }
}

function tone(ctx: AudioContext, frequency: number, start: number, length: number, volume: number): OscillatorNode {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + length);
  return oscillator;
}

const stopAll = (tones: OscillatorNode[]) => () =>
  tones.forEach((t) => {
    try {
      t.stop();
    } catch {
      // Already finished.
    }
  });

// Each play function returns a function that stops the sound.
export function playChime(): () => void {
  if (context?.state !== "running") return () => {};
  return stopAll([tone(context, 660, 0, 0.15, 0.2), tone(context, 880, 0.18, 0.25, 0.2)]);
}

export function playSiren(): () => void {
  if (context?.state !== "running") return () => {};
  const tones: OscillatorNode[] = [];
  for (let i = 0; i < 16; i++) tones.push(tone(context, i % 2 ? 660 : 880, i * 0.5, 0.48, 0.3));
  return stopAll(tones);
}
