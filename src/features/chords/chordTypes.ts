// Chord type definitions and pure helpers for the Chords feature.
//
// Each chord is described by its tones as semitone offsets from the root,
// paired with the interval-degree label used in "intervals" display mode.

import { NOTES } from "../../shared/constants";

export interface ChordTone {
  /** Semitone offset from the root, 0-11 */
  readonly semitone: number;
  /** Interval-degree label, e.g. "R", "b3", "5", "b7" */
  readonly degree: string;
}

export interface ChordType {
  /** Stable key used for persistence and lookups */
  readonly id: string;
  /** Short label shown on the toggle button, e.g. "maj7" */
  readonly label: string;
  /** Full name shown in the chord info line and summary */
  readonly name: string;
  readonly tones: readonly ChordTone[];
}

// A curated set covering the most popular chord types (pop/rock/folk/blues)
// while skipping the more esoteric extensions.
export const CHORD_TYPES: readonly ChordType[] = [
  {
    id: "maj",
    label: "maj",
    name: "Major",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 7, degree: "5" },
    ],
  },
  {
    id: "min",
    label: "min",
    name: "Minor",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 3, degree: "b3" },
      { semitone: 7, degree: "5" },
    ],
  },
  {
    id: "5",
    label: "5",
    name: "Power (5)",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 7, degree: "5" },
    ],
  },
  {
    id: "7",
    label: "7",
    name: "Dominant 7",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 7, degree: "5" },
      { semitone: 10, degree: "b7" },
    ],
  },
  {
    id: "maj7",
    label: "maj7",
    name: "Major 7",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 7, degree: "5" },
      { semitone: 11, degree: "7" },
    ],
  },
  {
    id: "m7",
    label: "m7",
    name: "Minor 7",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 3, degree: "b3" },
      { semitone: 7, degree: "5" },
      { semitone: 10, degree: "b7" },
    ],
  },
  {
    id: "sus2",
    label: "sus2",
    name: "Suspended 2",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 2, degree: "2" },
      { semitone: 7, degree: "5" },
    ],
  },
  {
    id: "sus4",
    label: "sus4",
    name: "Suspended 4",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 5, degree: "4" },
      { semitone: 7, degree: "5" },
    ],
  },
  {
    id: "dim",
    label: "dim",
    name: "Diminished",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 3, degree: "b3" },
      { semitone: 6, degree: "b5" },
    ],
  },
  {
    id: "aug",
    label: "aug",
    name: "Augmented",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 8, degree: "#5" },
    ],
  },
  {
    id: "6",
    label: "6",
    name: "Major 6",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 7, degree: "5" },
      { semitone: 9, degree: "6" },
    ],
  },
  {
    id: "add9",
    label: "add9",
    name: "Add 9",
    tones: [
      { semitone: 0, degree: "R" },
      { semitone: 4, degree: "3" },
      { semitone: 7, degree: "5" },
      { semitone: 2, degree: "9" },
    ],
  },
];

const CHORD_TYPE_BY_ID: ReadonlyMap<string, ChordType> = new Map(
  CHORD_TYPES.map((chord) => [chord.id, chord]),
);

/** Look up a chord type by id, falling back to the first (Major). */
export function getChordType(id: string): ChordType {
  return CHORD_TYPE_BY_ID.get(id) ?? CHORD_TYPES[0];
}

/**
 * Return the interval-degree label if the given note belongs to the chord,
 * or null otherwise.
 */
export function getChordToneDegree(
  chord: ChordType,
  noteIndex: number,
  rootIndex: number,
): string | null {
  const relative = (noteIndex - rootIndex + 12) % 12;
  const tone = chord.tones.find((t) => t.semitone % 12 === relative);
  return tone ? tone.degree : null;
}

/** Return the note names that spell the chord, root first. */
export function getChordNoteNames(chord: ChordType, rootIndex: number): string[] {
  return chord.tones.map((t) => NOTES[(rootIndex + t.semitone) % 12]);
}

/**
 * Map a chord-tone degree to the interval colour class used by the Scales
 * feature (root = red, 3rd & 5th = blue, everything else neutral).
 */
export function intervalColorClass(degree: string): string {
  if (degree === "R") return "interval-root";
  if (degree === "3" || degree === "b3") return "interval-third";
  if (degree === "5" || degree === "b5" || degree === "#5") return "interval-fifth";
  return "interval-other";
}
