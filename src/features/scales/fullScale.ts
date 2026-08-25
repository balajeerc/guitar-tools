import type { PentatonicPosition, ScaleType } from "../../shared/types";
import { TOTAL_FRETS } from "../../shared/constants";

export interface ScalePositionExtent {
  readonly position: PentatonicPosition;
  readonly startFret: number;
  readonly endFret: number;
  readonly partial: boolean;
}

/**
 * Five-position full-scale shapes for G, expressed as inclusive fret extents.
 * The minor extents follow the supplied G natural-minor reference. The major
 * extents use the equivalent five-position CAGED grouping.
 */
const G_ROOT_INDEX = 10;
const G_POSITION_EXTENTS: Record<
  ScaleType,
  Record<PentatonicPosition, readonly [number, number]>
> = {
  major: {
    1: [2, 5],
    2: [4, 8],
    3: [7, 10],
    4: [9, 13],
    5: [11, 15],
  },
  minor: {
    1: [2, 6],
    2: [5, 8],
    3: [6, 10],
    4: [10, 13],
    5: [11, 15],
  },
};

/** Return the five full-scale position extents visible on the fretboard. */
export function getFullScaleExtentsOnFretboard(
  rootIndex: number,
  scaleType: ScaleType,
): ScalePositionExtent[] {
  const rootOffset = (rootIndex - G_ROOT_INDEX + 12) % 12;
  const result: ScalePositionExtent[] = [];

  for (const positionText of Object.keys(G_POSITION_EXTENTS[scaleType])) {
    const position = Number(positionText) as PentatonicPosition;
    const [gStart, gEnd] = G_POSITION_EXTENTS[scaleType][position];
    const transposedStart = gStart + rootOffset;
    const transposedEnd = gEnd + rootOffset;

    for (const octaveOffset of [-24, -12, 0, 12, 24]) {
      const startFret = transposedStart + octaveOffset;
      const endFret = transposedEnd + octaveOffset;
      if (endFret < 0 || startFret > TOTAL_FRETS) continue;

      result.push({
        position,
        startFret: Math.max(0, startFret),
        endFret: Math.min(TOTAL_FRETS, endFret),
        partial: startFret < 0 || endFret > TOTAL_FRETS,
      });
    }
  }

  return result.sort((a, b) => a.startFret - b.startFret);
}
