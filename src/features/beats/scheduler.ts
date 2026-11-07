import { createLookaheadScheduler, type LookaheadScheduler } from '../../shared/lookaheadScheduler';

import { createDrumKit, type DrumKit, voicesAtStep } from './instruments';
import { type BeatPattern, STEP_COUNT, type TrackLevels } from './pattern';

export interface BeatsSchedulerConfig {
  bpm: number;
  levels: TrackLevels;
  pattern: BeatPattern;
}

export interface ScheduledStep {
  step: number;
  time: number;
}

export function createBeatsScheduler(
  getConfig: () => BeatsSchedulerConfig,
  onStepCallback: (step: ScheduledStep) => void
): LookaheadScheduler {
  let drumKit: DrumKit | null = null;
  let step = 0;

  return createLookaheadScheduler({
    stepDuration: () => 60 / getConfig().bpm / 4,
    onStart: (context) => {
      drumKit = createDrumKit(context);
    },
    onStop: () => {
      drumKit?.disconnect();
      drumKit = null;
    },
    onStep: (_context, time) => {
      const config = getConfig();
      const hits = voicesAtStep(config.pattern, config.levels, step);
      for (const hit of hits) drumKit?.play(hit.voice, time, hit.level);
      onStepCallback({ time, step });
      step = (step + 1) % STEP_COUNT;
    },
  });
}
