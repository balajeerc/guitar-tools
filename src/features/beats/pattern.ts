export const STEP_COUNT = 16;

export const DRUM_VOICES = ["kick", "snare", "hihat", "crash"] as const;

export type DrumVoice = (typeof DRUM_VOICES)[number];
export type BeatPattern = Record<DrumVoice, boolean[]>;
export type TrackLevels = Record<DrumVoice, number>;

interface DrumVoiceInfo {
  id: DrumVoice;
  label: string;
}

export const DRUM_VOICE_INFO: DrumVoiceInfo[] = [
  { id: "kick", label: "Kick" },
  { id: "snare", label: "Snare" },
  { id: "hihat", label: "Hi-hat" },
  { id: "crash", label: "Crash" },
];

export const DEFAULT_LEVELS: TrackLevels = {
  kick: 0.9,
  snare: 0.72,
  hihat: 0.42,
  crash: 0.38,
};

const DEFAULT_ACTIVE_STEPS: Record<DrumVoice, number[]> = {
  kick: [0, 8],
  snare: [4, 12],
  hihat: [0, 2, 4, 6, 8, 10, 12, 14],
  crash: [0],
};

function stepsFrom(activeSteps: number[]): boolean[] {
  return Array.from({ length: STEP_COUNT }, (_, step) =>
    activeSteps.includes(step),
  );
}

export function createDefaultPattern(): BeatPattern {
  return {
    kick: stepsFrom(DEFAULT_ACTIVE_STEPS.kick),
    snare: stepsFrom(DEFAULT_ACTIVE_STEPS.snare),
    hihat: stepsFrom(DEFAULT_ACTIVE_STEPS.hihat),
    crash: stepsFrom(DEFAULT_ACTIVE_STEPS.crash),
  };
}

export function normalizePattern(pattern: BeatPattern): BeatPattern {
  const fallback = createDefaultPattern();
  return {
    kick: normalizeSteps(pattern.kick, fallback.kick),
    snare: normalizeSteps(pattern.snare, fallback.snare),
    hihat: normalizeSteps(pattern.hihat, fallback.hihat),
    crash: normalizeSteps(pattern.crash, fallback.crash),
  };
}

function normalizeSteps(steps: boolean[], fallback: boolean[]): boolean[] {
  if (!Array.isArray(steps)) return fallback;
  return Array.from(
    { length: STEP_COUNT },
    (_, step) => steps[step] === true,
  );
}

export function normalizeLevels(levels: TrackLevels): TrackLevels {
  return {
    kick: normalizeLevel(levels.kick, DEFAULT_LEVELS.kick),
    snare: normalizeLevel(levels.snare, DEFAULT_LEVELS.snare),
    hihat: normalizeLevel(levels.hihat, DEFAULT_LEVELS.hihat),
    crash: normalizeLevel(levels.crash, DEFAULT_LEVELS.crash),
  };
}

function normalizeLevel(level: number, fallback: number): number {
  if (!Number.isFinite(level)) return fallback;
  return Math.min(1, Math.max(0, level));
}
