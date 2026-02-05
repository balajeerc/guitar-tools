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

/**
 * Get the interval name for a scale degree in pentatonic scale
 * @param scaleDegree - The scale degree (0-4)
 * @param scaleType - The scale type ("major" or "minor")
 * @returns The interval name (e.g., "R", "2", "3", "5", "6" or "7")
 */
export function getIntervalName(
  scaleDegree: number,
  scaleType: ScaleType,
): string {
  if (scaleDegree === 0) return "R";
  if (scaleDegree === 1) return "2";
  if (scaleDegree === 2) return "3";
  if (scaleDegree === 3) return "5";
  if (scaleDegree === 4) return scaleType === "major" ? "6" : "7";
  return "";
}
