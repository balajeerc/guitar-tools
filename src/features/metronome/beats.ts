// Pure helpers for metronome beat/accent bookkeeping

export type AccentLevel = "strong" | "weak" | "off";

export const MIN_BPM = 30;
export const MAX_BPM = 260;

/** Tempo nudge sizes for the single- and double-chevron buttons. */
export const SMALL_BPM_STEP = 1;
export const LARGE_BPM_STEP = 10;
const MIN_BEATS = 1;
const MAX_BEATS = 12;

/** Subdivisions per beat offered in the UI, with their labels. */
export const SUBDIVISIONS: { value: number; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
];

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export function clampBeats(beats: number): number {
  return Math.min(MAX_BEATS, Math.max(MIN_BEATS, Math.round(beats)));
}

export function nextAccent(level: AccentLevel): AccentLevel {
  if (level === "strong") return "weak";
  if (level === "weak") return "off";
  return "strong";
}

/** Grow/shrink an accent pattern to `count` beats, keeping existing choices. */
export function resizeAccents(
  accents: AccentLevel[],
  count: number,
): AccentLevel[] {
  return Array.from({ length: count }, (_, i) => {
    if (i < accents.length) return accents[i];
    return i === 0 ? "strong" : "weak";
  });
}

export function defaultAccents(count: number): AccentLevel[] {
  return resizeAccents([], count);
}
