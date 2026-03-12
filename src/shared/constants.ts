// Musical constants and CAGED pattern data

import type { CAGEDShape, PentatonicPosition } from "./types";

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

// Standard tuning (low to high): E A D G B E
// NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
// Indices: A=0, A#=1, B=2, C=3, C#=4, D=5, D#=6, E=7, F=8, F#=9, G=10, G#=11
export const OPEN_STRINGS: readonly number[] = [7, 0, 5, 10, 2, 7]; // E=7, A=0, D=5, G=10, B=2, E=7

// Pentatonic scale intervals (in semitones from root)
export const MAJOR_PENTATONIC: readonly number[] = [0, 2, 4, 7, 9]; // 1, 2, 3, 5, 6
export const MINOR_PENTATONIC: readonly number[] = [0, 3, 5, 7, 10]; // 1, b3, 4, 5, b7

// Full scale intervals (in semitones from root)
export const MAJOR_SCALE: readonly number[] = [0, 2, 4, 5, 7, 9, 11]; // 1, 2, 3, 4, 5, 6, 7
export const MINOR_SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10]; // 1, 2, b3, 4, 5, b6, b7

// CAGED pattern numbers
export const PATTERN_NUMBERS: Record<CAGEDShape, number> = {
  C: 3,
  A: 4,
  G: 5,
  E: 1,
  D: 2,
};

// Line colors for header display
export const LINE_COLORS: Record<CAGEDShape, string> = {
  C: "#e91e63",
  A: "#9c27b0",
  G: "#4caf50",
  E: "#ff9800",
  D: "#2196f3",
};

// Pentatonic position labels
export const POSITION_LABELS: Record<PentatonicPosition, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
};

// Line colors for pentatonic position header display
export const POSITION_LINE_COLORS: Record<PentatonicPosition, string> = {
  1: "#e91e63",
  2: "#9c27b0",
  3: "#4caf50",
  4: "#ff9800",
  5: "#2196f3",
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
