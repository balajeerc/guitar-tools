// Musical constants and CAGED pattern data

import type { CAGEDShape, CAGEDPatterns } from "./types";

// Musical notes (sharp notation)
export const NOTES: readonly string[] = [
  "A",
  "A#",
  "B",
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
];

// Musical notes (flat notation)
export const NOTES_FLAT: readonly string[] = [
  "A",
  "Bb",
  "B",
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
];

// Standard tuning (low to high): E A D G B E
// NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
// Indices: A=0, A#=1, B=2, C=3, C#=4, D=5, D#=6, E=7, F=8, F#=9, G=10, G#=11
export const OPEN_STRINGS: readonly number[] = [7, 0, 5, 10, 2, 7]; // E=7, A=0, D=5, G=10, B=2, E=7

// Pentatonic scale intervals (in semitones from root)
export const MAJOR_PENTATONIC: readonly number[] = [0, 2, 4, 7, 9]; // 1, 2, 3, 5, 6
export const MINOR_PENTATONIC: readonly number[] = [0, 3, 5, 7, 10]; // 1, b3, 4, 5, b7

// CAGED pattern numbers
export const PATTERN_NUMBERS: Record<CAGEDShape, number> = {
  C: 3,
  A: 4,
  G: 5,
  E: 1,
  D: 2,
};

// CAGED shape CSS classes
export const SHAPE_COLORS: Record<CAGEDShape, string> = {
  C: "shape-c",
  A: "shape-a",
  G: "shape-g",
  E: "shape-e",
  D: "shape-d",
};

// Line colors for header display
export const LINE_COLORS: Record<CAGEDShape, string> = {
  C: "#e91e63",
  A: "#9c27b0",
  G: "#4caf50",
  E: "#ff9800",
  D: "#2196f3",
};

// Major pentatonic CAGED shape patterns (relative fret positions per string)
// String order: [lowE, A, D, G, B, highE] (indices 0-5)
// Values are the fret offsets within each shape where notes appear
export const CAGED_PATTERNS: CAGEDPatterns = {
  // C shape: root on 5th string (A), open position friendly
  C: {
    // Low E, A, D, G, B, High E - fret ranges for each string
    stringRanges: [
      { min: 0, max: 3 }, // Low E: frets 0-3
      { min: 0, max: 3 }, // A: frets 0-3
      { min: 0, max: 2 }, // D: frets 0-2
      { min: 0, max: 2 }, // G: frets 0-2
      { min: 0, max: 1 }, // B: frets 0-1
      { min: 0, max: 3 }, // High E: frets 0-3
    ],
  },
  // A shape: root on 5th string (A), barre chord style
  A: {
    stringRanges: [
      { min: 0, max: 2 }, // Low E
      { min: 0, max: 2 }, // A
      { min: 0, max: 2 }, // D
      { min: 0, max: 2 }, // G
      { min: 0, max: 3 }, // B
      { min: 0, max: 2 }, // High E
    ],
  },
  // G shape: unique fingering
  G: {
    stringRanges: [
      { min: 0, max: 3 }, // Low E
      { min: 0, max: 2 }, // A
      { min: 0, max: 2 }, // D
      { min: 0, max: 2 }, // G
      { min: 0, max: 2 }, // B
      { min: 0, max: 3 }, // High E
    ],
  },
  // E shape: root on 6th string (E), barre chord style
  E: {
    stringRanges: [
      { min: 0, max: 2 }, // Low E
      { min: 0, max: 2 }, // A
      { min: 0, max: 2 }, // D
      { min: 0, max: 3 }, // G
      { min: 0, max: 2 }, // B
      { min: 0, max: 2 }, // High E
    ],
  },
  // D shape: root on 4th string (D)
  D: {
    stringRanges: [
      { min: 0, max: 2 }, // Low E
      { min: 0, max: 3 }, // A
      { min: 0, max: 2 }, // D
      { min: 0, max: 2 }, // G
      { min: 0, max: 2 }, // B
      { min: 0, max: 2 }, // High E
    ],
  },
};

// Fretboard layout constants
export const TOTAL_FRETS = 22;
export const NUT_POSITION = 50; // First fret (nut) X position in pixels
export const FRET_WIDTH = 55; // Width of each fret in pixels

// String Y positions (High E to Low E, top to bottom)
export const STRING_Y_POSITIONS = [20, 52, 84, 116, 148, 180];
export const STRING_THICKNESS = [1, 1.5, 2, 2.5, 3, 3.5];

// String order for rendering (High E to Low E)
export const STRING_ORDER = [5, 4, 3, 2, 1, 0];

// Fret marker positions
export const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_DOT_FRETS = [12];
export const MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
