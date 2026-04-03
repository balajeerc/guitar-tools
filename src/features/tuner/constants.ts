// Standard tuning string definitions for the guitar tuner

interface GuitarString {
  /** Display label (e.g. "E2") */
  label: string;
  /** Note name */
  note: string;
  /** MIDI note number */
  midi: number;
  /** Frequency in Hz */
  frequency: number;
  /** Note index in the NOTES array (0-11) */
  noteIndex: number;
}

/** Standard tuning strings, low to high (6th to 1st) */
export const STANDARD_TUNING: readonly GuitarString[] = [
  { label: "E2", note: "E", midi: 40, frequency: 82.41, noteIndex: 7 },
  { label: "A2", note: "A", midi: 45, frequency: 110.0, noteIndex: 0 },
  { label: "D3", note: "D", midi: 50, frequency: 146.83, noteIndex: 5 },
  { label: "G3", note: "G", midi: 55, frequency: 196.0, noteIndex: 10 },
  { label: "B3", note: "B", midi: 59, frequency: 246.94, noteIndex: 2 },
  { label: "E4", note: "E", midi: 64, frequency: 329.63, noteIndex: 7 },
];

/** Number of meter segments on each side of the center bar */
export const METER_SEGMENTS = 10;

/** Cents threshold to consider "in tune" */
export const IN_TUNE_THRESHOLD = 5;
