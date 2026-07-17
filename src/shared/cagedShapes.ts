// Generic CAGED neck-region helpers shared across features.
//
// The CAGED system divides the neck into five root-relative regions
// (C, A, G, E, D) that repeat every 12 frets. These regions depend only on
// the root note, so they apply to any chord or scale.

import type { CAGEDShape } from "./types";
import { getNoteAtPosition } from "./musicTheory";

/**
 * Get the CAGED shape at a specific fret position.
 * C shape: 3 frets, A: 2, G: 3, E: 2, D: 2 (relative to the root).
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
 * Get the fret at which each CAGED shape region starts, in order up the neck.
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

export interface ChordShapeBox {
  readonly shape: CAGEDShape;
  readonly startFret: number;
  /** Inclusive end fret of the shape's notes */
  readonly endFret: number;
}

/**
 * Each CAGED shape anchors its lowest root on a specific string and occupies a
 * fret window relative to that root, derived from the standard open-chord
 * shapes (e.g. open A = x02220 → window [root, root+2]). `lo`/`hi` are fret
 * offsets from the root fret on `anchorString` (0 = low E ... 5 = high E).
 */
const CAGED_SHAPE_WINDOWS: Record<
  CAGEDShape,
  { anchorString: number; lo: number; hi: number }
> = {
  C: { anchorString: 1, lo: -3, hi: 0 }, // root on A string, shape below it
  A: { anchorString: 1, lo: 0, hi: 2 }, // root on A string
  G: { anchorString: 0, lo: -3, hi: 0 }, // root on low E, shape below it
  E: { anchorString: 0, lo: 0, hi: 2 }, // root on low E
  D: { anchorString: 2, lo: 0, hi: 3 }, // root on D string
};

/** Bound the chord tones that fall within [lowFret, highFret] across all strings. */
function boundChordTones(
  isChordTone: (noteIndex: number) => boolean,
  lowFret: number,
  highFret: number,
): { startFret: number; endFret: number } | null {
  let minFret = Number.POSITIVE_INFINITY;
  let maxFret = Number.NEGATIVE_INFINITY;
  for (let string = 0; string < 6; string++) {
    for (let fret = lowFret; fret <= highFret; fret++) {
      if (!isChordTone(getNoteAtPosition(string, fret))) continue;
      if (fret < minFret) minFret = fret;
      if (fret > maxFret) maxFret = fret;
    }
  }
  if (minFret === Number.POSITIVE_INFINITY) return null;
  return { startFret: minFret, endFret: maxFret };
}

/** Boxes for one CAGED shape across every root occurrence on its anchor string. */
function boxesForShape(
  shape: CAGEDShape,
  rootIndex: number,
  isChordTone: (noteIndex: number) => boolean,
  totalFrets: number,
): ChordShapeBox[] {
  const { anchorString, lo, hi } = CAGED_SHAPE_WINDOWS[shape];
  const boxes: ChordShapeBox[] = [];

  for (let rootFret = 0; rootFret <= totalFrets; rootFret++) {
    if (getNoteAtPosition(anchorString, rootFret) !== rootIndex) continue;

    const winStart = rootFret + lo;
    // Skip windows that fall below the nut; the shape recurs an octave up.
    if (winStart < 0 || winStart > totalFrets) continue;

    const bounds = boundChordTones(
      isChordTone,
      Math.max(0, winStart),
      Math.min(totalFrets, rootFret + hi),
    );
    if (bounds) boxes.push({ shape, ...bounds });
  }

  return boxes;
}

/**
 * Compute the CAGED chord-shape boxes across the neck. For each shape, anchor
 * its window to every occurrence of the root on its anchor string, then bound
 * the chord's actual notes within that window. Returns boxes sorted by start
 * fret. `isChordTone` decides whether a pitch class belongs to the chord.
 */
export function getChordShapeBoxes(
  rootIndex: number,
  isChordTone: (noteIndex: number) => boolean,
  totalFrets: number,
): ChordShapeBox[] {
  const boxes: ChordShapeBox[] = [];
  for (const shape of Object.keys(CAGED_SHAPE_WINDOWS) as CAGEDShape[]) {
    boxes.push(...boxesForShape(shape, rootIndex, isChordTone, totalFrets));
  }
  boxes.sort((a, b) => a.startFret - b.startFret);
  return boxes;
}
