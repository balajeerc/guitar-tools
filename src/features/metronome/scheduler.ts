import { createLookaheadScheduler, type LookaheadScheduler } from '../../shared/lookaheadScheduler';

// Audio-clock scheduling lives in shared/lookaheadScheduler; this defines what a
// "step" means for the metronome — one subdivision of the bar.
import { type ClickKind, playClick } from './click';

import type { AccentLevel } from './beats';

export interface SchedulerConfig {
  accents: AccentLevel[];
  beats: number;
  bpm: number;
  subdivisions: number;
}

export interface Tick {
  beat: number;
  subdivision: number;
  /** AudioContext time at which this tick sounds */
  time: number;
}

function kindFor(accent: AccentLevel, subdivision: number): ClickKind {
  if (subdivision > 0) return 'subdivision';
  return accent === 'strong' ? 'strong' : 'weak';
}

/**
 * Create a scheduler that reads its tempo/meter from `getConfig` on every tick,
 * so changes take effect from the next tick without restarting playback.
 * `onTick` is called at schedule time; consumers should queue the tick and act
 * on it once `AudioContext.currentTime` reaches `tick.time`.
 */
export function createScheduler(
  getConfig: () => SchedulerConfig,
  onTick: (tick: Tick) => void
): LookaheadScheduler {
  let beat = 0;
  let subdivision = 0;

  return createLookaheadScheduler({
    stepDuration: () => {
      const { bpm, subdivisions } = getConfig();
      return 60 / bpm / subdivisions;
    },
    onStep: (context, time) => {
      const { accents, beats, subdivisions } = getConfig();
      if (beat >= beats) beat = 0;

      const accent = accents[beat] ?? 'weak';
      if (accent !== 'off' || subdivision > 0) {
        playClick(context, kindFor(accent, subdivision), time);
      }
      onTick({ time, beat, subdivision });

      subdivision += 1;
      if (subdivision >= subdivisions) {
        subdivision = 0;
        beat = (beat + 1) % beats;
      }
    },
  });
}
