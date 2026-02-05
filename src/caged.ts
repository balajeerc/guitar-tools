// CAGED system logic for guitar fretboard

import type { CAGEDShape } from "./types";

/**
 * Build a CAGED map that returns the shape for each string/fret combination
 * @param rootIndex - The root note index (0-11, where 0=A, 3=C)
 * @param totalFrets - Total number of frets on the fretboard
 * @returns 2D array where map[stringIndex][fret] = CAGEDShape
 */
export function buildCAGEDMap(
  rootIndex: number,
  totalFrets: number,
): CAGEDShape[][] {
  // Create a 2D map: map[stringIndex][fret] = shape
  const map: CAGEDShape[][] = [];
  for (let s = 0; s < 6; s++) {
    map[s] = [];
    for (let fret = 0; fret <= totalFrets; fret++) {
      map[s][fret] = getShapeAtFret(rootIndex, fret);
    }
  }

  return map;
}

/**
 * Get the CAGED shape at a specific fret position
 * Shape boundaries based on standard CAGED pentatonic positions:
 * C shape: 3 frets (0-2), A shape: 2 frets (3-4), G shape: 3 frets (5-7),
 * E shape: 2 frets (8-9), D shape: 2 frets (10-11)
 *
 * @param rootIndex - The root note index (0-11, where 0=A, 3=C)
 * @param fret - The fret number
 * @returns The CAGED shape at that position
 */
export function getShapeAtFret(rootIndex: number, fret: number): CAGEDShape {
  const offsetFromC = (rootIndex - 3 + 12) % 12;
  const posInCycle = (fret - offsetFromC + 120) % 12;

  if (posInCycle >= 0 && posInCycle < 3) return "C";
  if (posInCycle >= 3 && posInCycle < 5) return "A";
  if (posInCycle >= 5 && posInCycle < 8) return "G";
  if (posInCycle >= 8 && posInCycle < 10) return "E";
  return "D"; // 10, 11
}

/**
 * Get all shape boundaries for the fretboard header display
 * @param rootIndex - The root note index (0-11)
 * @param totalFrets - Total number of frets
 * @returns Array of {shape, startFret} objects
 */
export function getShapeBoundaries(
  rootIndex: number,
  totalFrets: number,
): { shape: CAGEDShape; fret: number }[] {
  const shapes: { shape: CAGEDShape; fret: number }[] = [];
  let prevShape: CAGEDShape | null = null;

  for (let fret = 0; fret <= totalFrets; fret++) {
    const shape = getShapeAtFret(rootIndex, fret);
    if (shape !== prevShape) {
      shapes.push({ shape, fret });
      prevShape = shape;
    }
  }

  return shapes;
}
