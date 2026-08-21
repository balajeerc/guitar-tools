import {
  createBeatsScheduler,
  type BeatsSchedulerConfig,
  type ScheduledStep,
} from "./scheduler";

export interface BeatsPlayback {
  start: () => Promise<void>;
  stop: () => void;
}

export function createBeatsPlayback(
  getConfig: () => BeatsSchedulerConfig,
  onStep: (step: number | null) => void,
): BeatsPlayback {
  const pending: ScheduledStep[] = [];
  let frame: number | null = null;
  const scheduler = createBeatsScheduler(getConfig, (step) => {
    pending.push(step);
  });

  function updatePlayhead(): void {
    const now = scheduler.now();
    while (pending.length > 0 && pending[0].time <= now) {
      const scheduled = pending.shift();
      if (scheduled) onStep(scheduled.step);
    }
    frame = requestAnimationFrame(updatePlayhead);
  }

  async function start(): Promise<void> {
    if (frame !== null) return;
    pending.length = 0;
    await scheduler.start();
    frame = requestAnimationFrame(updatePlayhead);
  }

  function stop(): void {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    scheduler.stop();
    pending.length = 0;
    onStep(null);
  }

  return { start, stop };
}
