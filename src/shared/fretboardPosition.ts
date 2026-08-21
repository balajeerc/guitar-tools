import {
  STRING_ORDER,
  STRING_Y_POSITIONS,
  TOTAL_FRETS,
} from "./constants";
import { fretCenterPosition } from "./fretboardRenderer";
import { getLayoutConfig } from "./layout";

export interface FretboardPosition {
  stringIdx: number;
  fret: number;
}

/** Resolve viewport coordinates to the closest physical string and fret. */
export function positionFromPoint(
  clientX: number,
  clientY: number,
  fretboard: HTMLElement,
): FretboardPosition | null {
  const config = getLayoutConfig();
  const rect = fretboard.getBoundingClientRect();
  const fretCoord = config.isVertical
    ? clientY - rect.top
    : clientX - rect.left;
  const stringCoord = config.isVertical
    ? clientX - rect.left
    : clientY - rect.top;

  let bestFret = 0;
  let bestFretDist = Infinity;
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const dist = Math.abs(fretCoord - fretCenterPosition(fret));
    if (dist < bestFretDist) {
      bestFretDist = dist;
      bestFret = fret;
    }
  }

  let bestVisual = 0;
  let bestStringDist = Infinity;
  for (let visualIdx = 0; visualIdx < STRING_ORDER.length; visualIdx++) {
    const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
    const dist = Math.abs(stringCoord - STRING_Y_POSITIONS[posIdx]);
    if (dist < bestStringDist) {
      bestStringDist = dist;
      bestVisual = visualIdx;
    }
  }

  return { stringIdx: STRING_ORDER[bestVisual], fret: bestFret };
}
