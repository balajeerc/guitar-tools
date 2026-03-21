// CAGED system logic for guitar fretboard

import type {
  CAGEDShape,
  ScaleType,
  PentatonicPosition,
} from "../../shared/types";
import { TOTAL_FRETS } from "../../shared/constants";

/**
 * Chord shape finger positions for each CAGED shape
 * Each shape defines the fret offsets for strings 0-5 (low E to high E)
 * null means the string is not played in the chord shape
 * The offset is relative to the shape's starting fret position
 *
 * For minor chords, we use the minor versions of each shape
 */
const MAJOR_CHORD_SHAPES: Record<
  CAGEDShape,
  Array<{ stringIdx: number; fretOffset: number }>
> = {
  // C shape major chord: x32010 (offsets relative to shape start fret)
  // When C shape starts at fret 0: A=3, D=2, G=0, B=1, E=0
  C: [
    { stringIdx: 1, fretOffset: 3 }, // A string: fret 3
    { stringIdx: 2, fretOffset: 2 }, // D string: fret 2
    { stringIdx: 3, fretOffset: 0 }, // G string: open
    { stringIdx: 4, fretOffset: 1 }, // B string: fret 1
    { stringIdx: 5, fretOffset: 0 }, // High E: open
  ],
  // A shape major chord: x02220 (offsets relative to shape start fret)
  // When A shape starts at fret 0: A=0, D=2, G=2, B=2, E=0
  A: [
    { stringIdx: 1, fretOffset: 0 }, // A string: open
    { stringIdx: 2, fretOffset: 2 }, // D string: fret 2
    { stringIdx: 3, fretOffset: 2 }, // G string: fret 2
    { stringIdx: 4, fretOffset: 2 }, // B string: fret 2
    { stringIdx: 5, fretOffset: 0 }, // High E: open
  ],
  // G shape major chord: 320003 (offsets relative to shape start fret)
  // When G shape starts at fret 0: E=3, A=2, D=0, G=0, B=0, E=3
  G: [
    { stringIdx: 0, fretOffset: 3 }, // Low E: fret 3
    { stringIdx: 1, fretOffset: 2 }, // A string: fret 2
    { stringIdx: 2, fretOffset: 0 }, // D string: open
    { stringIdx: 3, fretOffset: 0 }, // G string: open
    { stringIdx: 4, fretOffset: 0 }, // B string: open
    { stringIdx: 5, fretOffset: 3 }, // High E: fret 3
  ],
  // E shape major chord: 022100 (offsets relative to shape start fret)
  // When E shape starts at fret 0: E=0, A=2, D=2, G=1, B=0, E=0
  E: [
    { stringIdx: 0, fretOffset: 0 }, // Low E: open
    { stringIdx: 1, fretOffset: 2 }, // A string: fret 2
    { stringIdx: 2, fretOffset: 2 }, // D string: fret 2
    { stringIdx: 3, fretOffset: 1 }, // G string: fret 1
    { stringIdx: 4, fretOffset: 0 }, // B string: open
    { stringIdx: 5, fretOffset: 0 }, // High E: open
  ],
  // D shape major chord: xx0232 (offsets relative to shape start fret)
  // When D shape starts at fret 0: D=0, G=2, B=3, E=2
  D: [
    { stringIdx: 2, fretOffset: 0 }, // D string: open
    { stringIdx: 3, fretOffset: 2 }, // G string: fret 2
    { stringIdx: 4, fretOffset: 3 }, // B string: fret 3
    { stringIdx: 5, fretOffset: 2 }, // High E: fret 2
  ],
};

const MINOR_CHORD_SHAPES: Record<
  CAGEDShape,
  Array<{ stringIdx: number; fretOffset: number }>
> = {
  // Cm shape: x35543 (mini barre chord, relative offsets)
  // When Cm shape starts at fret 0 (actually played as barre at fret 3)
  // Simplified: A=3, D=1, G=0, B=1
  C: [
    { stringIdx: 1, fretOffset: 3 }, // A string: root
    { stringIdx: 2, fretOffset: 1 }, // D string: 5th
    { stringIdx: 3, fretOffset: 0 }, // G string: b3
    { stringIdx: 4, fretOffset: 1 }, // B string: root
  ],
  // Am shape: x02210 (offsets relative to shape start fret)
  // When Am shape starts at fret 0: A=0, D=2, G=2, B=1, E=0
  A: [
    { stringIdx: 1, fretOffset: 0 }, // A string: root
    { stringIdx: 2, fretOffset: 2 }, // D string: 5th
    { stringIdx: 3, fretOffset: 2 }, // G string: root
    { stringIdx: 4, fretOffset: 1 }, // B string: b3
    { stringIdx: 5, fretOffset: 0 }, // High E: 5th
  ],
  // Gm shape: 310033 (offsets relative to shape start fret)
  // When Gm shape starts at fret 0: E=3, A=1, D=0, G=0, B=3, E=3
  G: [
    { stringIdx: 0, fretOffset: 3 }, // Low E: root
    { stringIdx: 1, fretOffset: 1 }, // A string: b3
    { stringIdx: 2, fretOffset: 0 }, // D string: 5th
    { stringIdx: 3, fretOffset: 0 }, // G string: root
    { stringIdx: 4, fretOffset: 3 }, // B string: 5th
    { stringIdx: 5, fretOffset: 3 }, // High E: root
  ],
  // Em shape: 022000 (offsets relative to shape start fret)
  // When Em shape starts at fret 0: E=0, A=2, D=2, G=0, B=0, E=0
  E: [
    { stringIdx: 0, fretOffset: 0 }, // Low E: root
    { stringIdx: 1, fretOffset: 2 }, // A string: 5th
    { stringIdx: 2, fretOffset: 2 }, // D string: root
    { stringIdx: 3, fretOffset: 0 }, // G string: b3
    { stringIdx: 4, fretOffset: 0 }, // B string: 5th
    { stringIdx: 5, fretOffset: 0 }, // High E: root
  ],
  // Dm shape: xx0231 (offsets relative to shape start fret)
  // When Dm shape starts at fret 0: D=0, G=2, B=3, E=1
  D: [
    { stringIdx: 2, fretOffset: 0 }, // D string: 5th
    { stringIdx: 3, fretOffset: 2 }, // G string: root
    { stringIdx: 4, fretOffset: 3 }, // B string: 5th
    { stringIdx: 5, fretOffset: 1 }, // High E: b3
  ],
};

/**
 * Get the chord shape positions for a given shape and scale type
 * @param shape - The CAGED shape
 * @param scaleType - "major" or "minor"
 * @returns Array of string/fret offset positions
 */
export function getChordShapePositions(
  shape: CAGEDShape,
  scaleType: ScaleType,
): Array<{ stringIdx: number; fretOffset: number }> {
  return scaleType === "major"
    ? MAJOR_CHORD_SHAPES[shape]
    : MINOR_CHORD_SHAPES[shape];
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

/**
 * Hardcoded pentatonic position extents: [startFret, endFret] (inclusive).
 * Keyed by rootIndex (0=A, 1=A#, ... 11=G#), then scaleType, then position.
 * Adjacent positions overlap by 1-2 frets (shared frets playable in either position).
 * These repeat every 12 frets on the fretboard.
 */
// prettier-ignore
const PENTATONIC_POSITION_TABLE: Record<
  number,
  Record<ScaleType, Record<PentatonicPosition, [number, number]>>
> = {
  0: { // A
    major: { 1: [4, 7],  2: [6, 10],  3: [9, 12],  4: [11, 14], 5: [2, 5] },
    minor: { 1: [5, 8],  2: [7, 10],  3: [9, 13],  4: [12, 15], 5: [2, 5] },
  },
  1: { // A#
    major: { 1: [5, 8],  2: [7, 11],  3: [10, 13], 4: [12, 15], 5: [3, 6] },
    minor: { 1: [6, 9],  2: [8, 11],  3: [10, 14], 4: [1, 4],   5: [3, 6] },
  },
  2: { // B
    major: { 1: [6, 9],  2: [8, 12],  3: [11, 14], 4: [1, 4],   5: [4, 7] },
    minor: { 1: [7, 10], 2: [9, 12],  3: [11, 15], 4: [2, 5],   5: [4, 7] },
  },
  3: { // C
    major: { 1: [7, 10], 2: [9, 13],  3: [12, 15], 4: [2, 5],   5: [5, 8] },
    minor: { 1: [8, 11], 2: [10, 13], 3: [12, 16], 4: [3, 6],   5: [5, 8] },
  },
  4: { // C#
    major: { 1: [8, 11], 2: [10, 14], 3: [1, 4],   4: [3, 6],   5: [6, 9] },
    minor: { 1: [9, 12], 2: [11, 14], 3: [1, 5],   4: [4, 7],   5: [6, 9] },
  },
  5: { // D
    major: { 1: [9, 12], 2: [11, 15], 3: [2, 5],   4: [4, 7],   5: [7, 10] },
    minor: { 1: [10, 13], 2: [12, 15], 3: [2, 6],  4: [5, 8],   5: [7, 10] },
  },
  6: { // D#
    major: { 1: [10, 13], 2: [12, 16], 3: [3, 6],  4: [5, 8],   5: [8, 11] },
    minor: { 1: [11, 14], 2: [1, 4],   3: [3, 7],  4: [6, 9],   5: [8, 11] },
  },
  7: { // E
    major: { 1: [11, 14], 2: [1, 5],   3: [4, 7],  4: [6, 9],   5: [9, 12] },
    minor: { 1: [12, 15], 2: [2, 5],   3: [4, 8],  4: [7, 10],  5: [9, 12] },
  },
  8: { // F
    major: { 1: [12, 15], 2: [2, 6],   3: [5, 8],  4: [7, 10],  5: [10, 13] },
    minor: { 1: [1, 4],   2: [3, 6],   3: [5, 9],  4: [8, 11],  5: [10, 13] },
  },
  9: { // F#
    major: { 1: [1, 4],   2: [3, 7],   3: [6, 9],  4: [8, 11],  5: [11, 14] },
    minor: { 1: [2, 5],   2: [4, 7],   3: [6, 10], 4: [9, 12],  5: [11, 14] },
  },
  10: { // G
    major: { 1: [2, 5],  2: [4, 8],   3: [7, 10],  4: [9, 12],  5: [12, 15] },
    minor: { 1: [3, 6],  2: [5, 8],   3: [7, 11],  4: [10, 13], 5: [12, 15] },
  },
  11: { // G#
    major: { 1: [3, 6],  2: [5, 9],   3: [8, 11],  4: [10, 13], 5: [1, 4] },
    minor: { 1: [4, 7],  2: [6, 9],   3: [8, 12],  4: [11, 14], 5: [1, 4] },
  },
};

/**
 * Get all pentatonic position extents visible on the fretboard.
 * Returns positions with their start/end frets (inclusive), sorted by start fret.
 * Positions may overlap where adjacent shapes share frets.
 * @param rootIndex - The root note index (0-11, where 0=A)
 * @param scaleType - "major" or "minor"
 * @param totalFrets - Total number of frets on the fretboard
 */
export function getPentatonicExtentsOnFretboard(
  rootIndex: number,
  scaleType: ScaleType,
): Array<{
  position: PentatonicPosition;
  startFret: number;
  endFret: number;
  partial: boolean;
}> {
  const positionExtents = PENTATONIC_POSITION_TABLE[rootIndex][scaleType];
  const result: Array<{
    position: PentatonicPosition;
    startFret: number;
    endFret: number;
    partial: boolean;
  }> = [];

  for (const posStr of Object.keys(positionExtents)) {
    const position = Number(posStr) as PentatonicPosition;
    const [baseStart, baseEnd] = positionExtents[position];

    // Cycle positions every 12 frets to cover the entire fretboard
    for (const shift of [-12, 0, 12, 24]) {
      const startFret = baseStart + shift;
      const endFret = baseEnd + shift;

      // Skip if entirely off fretboard
      if (endFret < 0 || startFret > TOTAL_FRETS) continue;

      const clamped = startFret < 0 || endFret > TOTAL_FRETS;
      result.push({
        position,
        startFret: Math.max(0, startFret),
        endFret: Math.min(endFret, TOTAL_FRETS),
        partial: clamped,
      });
    }
  }

  result.sort((a, b) => a.startFret - b.startFret);
  return result;
}
