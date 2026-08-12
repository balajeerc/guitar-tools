// Ties the audio scheduler to the on-screen beat dots and pendulum. Ticks are
// queued when scheduled and only surfaced visually once the audio clock reaches
// them, so what you see lines up with what you hear.

import type { SchedulerConfig, Tick } from "./scheduler";
import { createScheduler } from "./scheduler";
import { pendulumAngle } from "./visuals";

export interface PlaybackHandlers {
  onBeat: (beat: number | null) => void;
  onAngle: (angle: number) => void;
}

export interface Playback {
  start: () => Promise<void>;
  stop: () => void;
}

export function createPlayback(
  getConfig: () => SchedulerConfig,
  handlers: PlaybackHandlers,
): Playback {
  const pending: Tick[] = [];
  /** Monotonic beat counter driving which way the pendulum swings. */
  let swings = -1;
  /** 0 until the first beat has sounded; the arm hangs still until then. */
  let currentBeatTime = 0;
  let frame: number | null = null;

  const scheduler = createScheduler(getConfig, (tick) => {
    if (tick.subdivision === 0) pending.push(tick);
  });

  function drain(now: number): void {
    while (pending.length > 0 && pending[0].time <= now) {
      const tick = pending.shift();
      if (!tick) break;
      currentBeatTime = tick.time;
      swings += 1;
      handlers.onBeat(tick.beat);
    }
  }

  function tickFrame(): void {
    const now = scheduler.now();
    drain(now);
    if (currentBeatTime === 0) {
      handlers.onAngle(0);
    } else {
      const secondsPerBeat = 60 / getConfig().bpm;
      const progress = Math.min(1, (now - currentBeatTime) / secondsPerBeat);
      handlers.onAngle(pendulumAngle(swings + progress));
    }
    frame = requestAnimationFrame(tickFrame);
  }

  async function start(): Promise<void> {
    if (frame !== null) return;
    pending.length = 0;
    swings = -1;
    currentBeatTime = 0;
    await scheduler.start();
    frame = requestAnimationFrame(tickFrame);
  }

  function stop(): void {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    scheduler.stop();
    pending.length = 0;
    handlers.onBeat(null);
    handlers.onAngle(0);
  }

  return { start, stop };
}
