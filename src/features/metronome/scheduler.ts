import { createScreenWakeLock } from "../../shared/screenWakeLock";

// Lookahead click scheduler: a coarse JS timer queues clicks slightly ahead of
// time on the sample-accurate WebAudio clock, so tempo stays rock steady even
// when the main thread stutters.

import type { AccentLevel } from "./beats";
import { playClick, type ClickKind } from "./click";

export interface SchedulerConfig {
  bpm: number;
  beats: number;
  subdivisions: number;
  accents: AccentLevel[];
}

export interface Tick {
  /** AudioContext time at which this tick sounds */
  time: number;
  beat: number;
  subdivision: number;
}

export interface Scheduler {
  start: () => Promise<void>;
  stop: () => void;
  /** Current audio clock time, for comparing against queued tick times. */
  now: () => number;
}

/** How often the JS timer wakes up to top up the schedule. */
const LOOKAHEAD_MS = 25;
/** How far ahead of the audio clock clicks are queued. */
const SCHEDULE_AHEAD_S = 0.12;

function kindFor(accent: AccentLevel, subdivision: number): ClickKind {
  if (subdivision > 0) return "subdivision";
  return accent === "strong" ? "strong" : "weak";
}

/**
 * Create a scheduler that reads its tempo/meter from `getConfig` on every tick,
 * so changes take effect from the next tick without restarting playback.
 * `onTick` is called at schedule time; consumers should queue the tick and act
 * on it once `AudioContext.currentTime` reaches `tick.time`.
 */
export function createScheduler(
  getConfig: () => SchedulerConfig,
  onTick: (tick: Tick) => void,
): Scheduler {
  let ctx: AudioContext | null = null;
  let timer: number | null = null;
  const wakeLock = createScreenWakeLock();
  let nextTickTime = 0;
  let beat = 0;
  let subdivision = 0;

  function scheduleDue(): void {
    if (!ctx) return;
    while (nextTickTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const { bpm, beats, subdivisions, accents } = getConfig();
      if (beat >= beats) beat = 0;

      const accent = accents[beat] ?? "weak";
      if (accent !== "off" || subdivision > 0) {
        playClick(ctx, kindFor(accent, subdivision), nextTickTime);
      }
      onTick({ time: nextTickTime, beat, subdivision });

      nextTickTime += 60 / bpm / subdivisions;
      subdivision += 1;
      if (subdivision >= subdivisions) {
        subdivision = 0;
        beat = (beat + 1) % beats;
      }
    }
  }

  async function start(): Promise<void> {
    if (timer !== null) return;
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();

    beat = 0;
    subdivision = 0;
    // Small offset so the first click is comfortably inside the lookahead.
    nextTickTime = ctx.currentTime + 0.06;
    scheduleDue();
    timer = window.setInterval(scheduleDue, LOOKAHEAD_MS);
    wakeLock.start();
  }

  function stop(): void {
    wakeLock.stop();
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    if (ctx) {
      void ctx.close();
      ctx = null;
    }
  }

  return { start, stop, now: () => ctx?.currentTime ?? 0 };
}
