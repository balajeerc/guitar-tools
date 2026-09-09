import type { Melody } from "./catalog";
import { melodyToneProfile, type SynthTone } from "./tone";

export interface MelodyPlayer {
  play: (melody: Melody, tone: SynthTone) => Promise<void>;
  stop: () => void;
}

const START_DELAY_SECONDS = 0.08;

function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function scheduleNote(
  ctx: AudioContext,
  midi: number,
  start: number,
  duration: number,
  tone: SynthTone,
): OscillatorNode {
  const profile = melodyToneProfile(tone);
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const release = Math.max(0.05, Math.min(0.16, duration * profile.releaseRatio));
  const attackEnd = start + Math.min(profile.attackSeconds, duration * 0.2);
  const releaseStart = Math.max(attackEnd, start + duration - release);

  oscillator.type = profile.oscillator;
  oscillator.frequency.setValueAtTime(midiFrequency(midi), start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.filterHz, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(profile.peakGain, attackEnd);
  gain.gain.exponentialRampToValueAtTime(profile.sustainGain, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
  return oscillator;
}

export function createMelodyPlayer(): MelodyPlayer {
  let context: AudioContext | null = null;
  let scheduled: OscillatorNode[] = [];

  function stop(): void {
    for (const oscillator of scheduled) oscillator.stop();
    scheduled = [];
  }

  async function play(melody: Melody, tone: SynthTone): Promise<void> {
    stop();
    context ??= new AudioContext();
    const ctx = context;
    if (ctx.state === "suspended") await ctx.resume();
    const beatSeconds = 60 / melody.bpm;
    let cursor = ctx.currentTime + START_DELAY_SECONDS;
    scheduled = melody.notes.map(({ midi, beats, restAfterBeats = 0 }) => {
      const duration = beats * beatSeconds;
      const oscillator = scheduleNote(ctx, midi, cursor, duration * 0.88, tone);
      cursor += duration + restAfterBeats * beatSeconds;
      return oscillator;
    });
    await new Promise<void>((resolve) => window.setTimeout(resolve, (cursor - ctx.currentTime) * 1000));
    scheduled = [];
  }

  return { play, stop };
}
