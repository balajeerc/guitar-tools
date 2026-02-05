// Music theory utility functions

import type { ScaleType } from "./types";
import { OPEN_STRINGS, MAJOR_PENTATONIC, MINOR_PENTATONIC } from "./constants";

/**
 * Get the note index at a specific fret on a specific string
 * @param stringIndex - The string index (0 = low E, 5 = high E)
 * @param fret - The fret number (0 = open)
 * @returns The note index (0-11, where 0 = A)
 */
export function getNoteAtPosition(stringIndex: number, fret: number): number {
  const openNote = OPEN_STRINGS[stringIndex];
  return (openNote + fret) % 12;
}

/**
 * Check if a note is in the current pentatonic scale
 * @param noteIndex - The note index (0-11)
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @returns True if the note is in the scale
 */
export function isInScale(
  noteIndex: number,
  rootIndex: number,
  scaleType: ScaleType,
): boolean {
  const intervals = scaleType === "major" ? MAJOR_PENTATONIC : MINOR_PENTATONIC;
  const relativeNote = (noteIndex - rootIndex + 12) % 12;
  return intervals.includes(relativeNote);
}

/**
 * Get the scale degree of a note (0=root, 1=2nd, 2=3rd, etc.)
 * @param noteIndex - The note index (0-11)
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @returns The scale degree index (0-4 for pentatonic), or -1 if not in scale
 */
export function getScaleDegree(
  noteIndex: number,
  rootIndex: number,
  scaleType: ScaleType,
): number {
  const intervals = scaleType === "major" ? MAJOR_PENTATONIC : MINOR_PENTATONIC;
  const relativeNote = (noteIndex - rootIndex + 12) % 12;
  return intervals.indexOf(relativeNote);
}
