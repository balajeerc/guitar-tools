import { createScreenWakeLock } from "../../shared/screenWakeLock";

import { createDrumKit, voicesAtStep, type DrumKit } from "./instruments";
import { STEP_COUNT, type BeatPattern, type TrackLevels } from "./pattern";

export interface BeatsSchedulerConfig {
  bpm: number;
  pattern: BeatPattern;
  levels: TrackLevels;
}

export interface ScheduledStep {
  time: number;
  step: number;
}

export interface BeatsScheduler {
  start: () => Promise<void>;
  stop: () => void;
  now: () => number;
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;

export function createBeatsScheduler(
  getConfig: () => BeatsSchedulerConfig,
  onStep: (step: ScheduledStep) => void,
): BeatsScheduler {
  let context: AudioContext | null = null;
  let drumKit: DrumKit | null = null;
  let timer: number | null = null;
  const wakeLock = createScreenWakeLock();
  let nextStepTime = 0;
  let step = 0;

  function scheduleDueSteps(): void {
    if (!context || !drumKit) return;
    while (nextStepTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const config = getConfig();
      const hits = voicesAtStep(config.pattern, config.levels, step);
      for (const hit of hits) drumKit.play(hit.voice, nextStepTime, hit.level);
      onStep({ time: nextStepTime, step });
      nextStepTime += 60 / config.bpm / 4;
      step = (step + 1) % STEP_COUNT;
    }
  }

  async function start(): Promise<void> {
    if (timer !== null) return;
    context = new AudioContext();
    drumKit = createDrumKit(context);
    if (context.state === "suspended") await context.resume();
    step = 0;
    nextStepTime = context.currentTime + 0.06;
    scheduleDueSteps();
    timer = window.setInterval(scheduleDueSteps, LOOKAHEAD_MS);
    wakeLock.start();
  }

  function stop(): void {
    wakeLock.stop();
    if (timer !== null) clearInterval(timer);
    timer = null;
    drumKit?.disconnect();
    drumKit = null;
    if (context) void context.close();
    context = null;
  }

  return { start, stop, now: () => context?.currentTime ?? 0 };
}
