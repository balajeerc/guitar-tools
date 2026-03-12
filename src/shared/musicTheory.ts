// Music theory utility functions

import type { ScaleType } from "./types";
import {
  OPEN_STRINGS,
  MAJOR_PENTATONIC,
  MINOR_PENTATONIC,
  MAJOR_SCALE,
  MINOR_SCALE,
} from "./constants";

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

function getIntervals(scaleType: ScaleType, useFullScale: boolean): readonly number[] {
  if (useFullScale) {
    return scaleType === "major" ? MAJOR_SCALE : MINOR_SCALE;
  }
  return scaleType === "major" ? MAJOR_PENTATONIC : MINOR_PENTATONIC;
}

/**
 * Check if a note is in the current scale
 * @param noteIndex - The note index (0-11)
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @param useFullScale - If true, use the full 7-note scale instead of pentatonic
 * @returns True if the note is in the scale
 */
export function isInScale(
  noteIndex: number,
  rootIndex: number,
  scaleType: ScaleType,
  useFullScale = false,
): boolean {
  const intervals = getIntervals(scaleType, useFullScale);
  const relativeNote = (noteIndex - rootIndex + 12) % 12;
  return intervals.includes(relativeNote);
}

/**
 * Get the scale degree of a note
 * @param noteIndex - The note index (0-11)
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @param useFullScale - If true, use the full 7-note scale instead of pentatonic
 * @returns The scale degree index (0-4 for pentatonic, 0-6 for full), or -1 if not in scale
 */
export function getScaleDegree(
  noteIndex: number,
  rootIndex: number,
  scaleType: ScaleType,
  useFullScale = false,
): number {
  const intervals = getIntervals(scaleType, useFullScale);
  const relativeNote = (noteIndex - rootIndex + 12) % 12;
  return intervals.indexOf(relativeNote);
}
