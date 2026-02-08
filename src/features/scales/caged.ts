// CAGED system logic for guitar fretboard

import type {
  CAGEDShape,
  ScaleType,
  PentatonicPosition,
} from "../../shared/types";

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
function getShapeAtFret(rootIndex: number, fret: number): CAGEDShape {
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
 * Map CAGED shape to pentatonic position
 * The standard pentatonic positions align with CAGED shapes:
 * - Position 1 → E shape (root on low E string)
 * - Position 2 → D shape
 * - Position 3 → C shape
 * - Position 4 → A shape
 * - Position 5 → G shape
 */
const CAGED_TO_PENTATONIC_POSITION: Record<CAGEDShape, PentatonicPosition> = {
  E: 1,
  D: 2,
  C: 3,
  A: 4,
  G: 5,
};

/**
 * Get the pentatonic position at a specific fret
 * @param rootIndex - The root note index (0-11, where 0=A)
 * @param fret - The fret number
 * @returns The pentatonic position (1-5) at that fret
 */
function getPentatonicPositionAtFret(
  rootIndex: number,
  fret: number,
): PentatonicPosition {
  // Get the CAGED shape at this fret and map it to pentatonic position
  const shape = getShapeAtFret(rootIndex, fret);
  return CAGED_TO_PENTATONIC_POSITION[shape];
}

/**
 * Get all pentatonic position boundaries for the fretboard header display
 * @param rootIndex - The root note index (0-11)
 * @param totalFrets - Total number of frets
 * @returns Array of {position, fret} objects
 */
export function getPentatonicPositionBoundaries(
  rootIndex: number,
  totalFrets: number,
): { position: PentatonicPosition; fret: number }[] {
  const positions: { position: PentatonicPosition; fret: number }[] = [];
  let prevPosition: PentatonicPosition | null = null;

  for (let fret = 0; fret <= totalFrets; fret++) {
    const position = getPentatonicPositionAtFret(rootIndex, fret);
    if (position !== prevPosition) {
      positions.push({ position, fret });
      prevPosition = position;
    }
  }

  return positions;
}

/**
 * Shape cycle order and boundaries within the 12-semitone cycle
 * Each entry: [startPosInCycle, endPosInCycle (exclusive), shape]
 */
const SHAPE_CYCLE_BOUNDARIES: Array<{
  start: number;
  end: number;
  shape: CAGEDShape;
}> = [
  { start: 0, end: 3, shape: "C" },
  { start: 3, end: 5, shape: "A" },
  { start: 5, end: 8, shape: "G" },
  { start: 8, end: 10, shape: "E" },
  { start: 10, end: 12, shape: "D" },
];

/**
 * Get the position in cycle for a given fret and root
 */
function getPosInCycle(rootIndex: number, fret: number): number {
  const offsetFromC = (rootIndex - 3 + 12) % 12;
  return (fret - offsetFromC + 120) % 12;
}

/**
 * Get all CAGED shapes that a note at a given fret belongs to.
 * Notes at shape boundaries belong to both adjacent shapes.
 * @param rootIndex - The root note index (0-11)
 * @param fret - The fret number
 * @returns Array of CAGED shapes this fret position belongs to
 */
export function getShapesForFret(rootIndex: number, fret: number): CAGEDShape[] {
  const posInCycle = getPosInCycle(rootIndex, fret);
  const shapes: CAGEDShape[] = [];

  for (const boundary of SHAPE_CYCLE_BOUNDARIES) {
    // Check if this position is within the shape's range
    if (posInCycle >= boundary.start && posInCycle < boundary.end) {
      shapes.push(boundary.shape);
    }
    // Check if this position is at the boundary (last fret of shape, also belongs to next)
    if (posInCycle === boundary.end - 1) {
      // Find the next shape in cycle
      const nextIdx =
        (SHAPE_CYCLE_BOUNDARIES.findIndex((b) => b.shape === boundary.shape) +
          1) %
        5;
      const nextShape = SHAPE_CYCLE_BOUNDARIES[nextIdx].shape;
      if (!shapes.includes(nextShape)) {
        shapes.push(nextShape);
      }
    }
    // Check if this position is at the start of a shape (also belongs to previous)
    if (posInCycle === boundary.start) {
      const prevIdx =
        (SHAPE_CYCLE_BOUNDARIES.findIndex((b) => b.shape === boundary.shape) +
          4) %
        5;
      const prevShape = SHAPE_CYCLE_BOUNDARIES[prevIdx].shape;
      if (!shapes.includes(prevShape)) {
        shapes.push(prevShape);
      }
    }
  }

  return shapes;
}

/**
 * Get all pentatonic positions that a note at a given fret belongs to.
 * @param rootIndex - The root note index (0-11)
 * @param fret - The fret number
 * @returns Array of pentatonic positions this fret position belongs to
 */
export function getPentatonicPositionsForFret(
  rootIndex: number,
  fret: number,
): PentatonicPosition[] {
  const shapes = getShapesForFret(rootIndex, fret);
  return shapes.map((shape) => CAGED_TO_PENTATONIC_POSITION[shape]);
}
