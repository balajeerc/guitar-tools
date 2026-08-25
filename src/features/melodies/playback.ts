import type { Melody } from "./catalog";

export interface MelodyPlayer {
  play: (melody: Melody) => Promise<void>;
  stop: () => void;
}

const START_DELAY_SECONDS = 0.08;

function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function scheduleNote(ctx: AudioContext, midi: number, start: number, duration: number): OscillatorNode {
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const release = Math.max(0.06, Math.min(0.14, duration * 0.3));

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(midiFrequency(midi), start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.32, start + 0.015);
  gain.gain.setValueAtTime(0.24, Math.max(start + 0.02, start + duration - release));
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

  async function play(melody: Melody): Promise<void> {
    stop();
    context ??= new AudioContext();
    const ctx = context;
    if (ctx.state === "suspended") await ctx.resume();
    const beatSeconds = 60 / melody.bpm;
    let cursor = ctx.currentTime + START_DELAY_SECONDS;
    scheduled = melody.notes.map(({ midi, beats }) => {
      const duration = beats * beatSeconds;
      const oscillator = scheduleNote(ctx, midi, cursor, duration * 0.88);
      cursor += duration;
      return oscillator;
    });
    await new Promise<void>((resolve) => window.setTimeout(resolve, (cursor - ctx.currentTime) * 1000));
    scheduled = [];
  }

  return { play, stop };
}
