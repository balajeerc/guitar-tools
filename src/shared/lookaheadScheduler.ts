import { createScreenWakeLock } from './screenWakeLock';

/** How often the coarse JS timer wakes up to top up the schedule. */
const LOOKAHEAD_MS = 25;
/** How far ahead of the audio clock steps are queued. */
const SCHEDULE_AHEAD_S = 0.12;
/** Small offset so the first step lands comfortably inside the lookahead. */
const START_OFFSET_S = 0.06;

export interface LookaheadScheduler {
  /** Current audio clock time, for comparing against queued step times. */
  now: () => number;
  start: () => Promise<void>;
  stop: () => void;
}

interface LookaheadSchedulerOptions {
  /** Optional hook invoked with the fresh context before scheduling begins. */
  onStart?: (context: AudioContext) => void;
  /** Called once per due step with its scheduled audio time and the owned context. */
  onStep: (context: AudioContext, time: number) => void;
  /** Optional hook invoked on stop, before the context is closed. */
  onStop?: () => void;
  /** Seconds by which to advance the schedule cursor per step, read live. */
  stepDuration: () => number;
}

/**
 * Lookahead scheduler: a coarse JS timer queues work slightly ahead of time on
 * the sample-accurate WebAudio clock, so tempo stays rock steady even when the
 * main thread stutters. Each feature defines what a "step" means; this owns the
 * audio context, the top-up timer, and the wake lock.
 */
export function createLookaheadScheduler(options: LookaheadSchedulerOptions): LookaheadScheduler {
  let context: AudioContext | null = null;
  let timer: null | number = null;
  let nextTime = 0;
  const wakeLock = createScreenWakeLock();

  function scheduleDue(): void {
    if (!context) return;
    while (nextTime < context.currentTime + SCHEDULE_AHEAD_S) {
      options.onStep(context, nextTime);
      nextTime += options.stepDuration();
    }
  }

  async function start(): Promise<void> {
    if (timer !== null) return;
    context = new AudioContext();
    options.onStart?.(context);
    if (context.state === 'suspended') await context.resume();
    nextTime = context.currentTime + START_OFFSET_S;
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
    if (context) {
      options.onStop?.();
      void context.close();
      context = null;
    }
  }

  return { start, stop, now: () => context?.currentTime ?? 0 };
}
