import { describe, expect, it } from 'vitest';

import { computeGroupBands } from '../fretboard-discovery/grouping';

import {
  getChordShapePositions,
  getPentatonicExtentsOnFretboard,
  getShapeAtFret,
  getShapeBoundaries,
} from './caged';
import { getFullScaleExtentsOnFretboard } from './fullScale';

const examples = Array.from({ length: 12 }, (_, root) => root);

describe('CAGED and scale positions', () => {
  it.each(examples)('lays out every visible shape for root %i', (root) => {
    expect({
      chords: (['C', 'A', 'G', 'E', 'D'] as const).map((shape) => ({
        shape,
        major: getChordShapePositions(shape, 'major'),
        minor: getChordShapePositions(shape, 'minor'),
      })),
      boundaries: getShapeBoundaries(root, 22),
      labels: Array.from({ length: 23 }, (_, fret) => getShapeAtFret(root, fret)),
      major: getPentatonicExtentsOnFretboard(root, 'major'),
      minor: getPentatonicExtentsOnFretboard(root, 'minor'),
      fullMajor: getFullScaleExtentsOnFretboard(root, 'major'),
      fullMinor: getFullScaleExtentsOnFretboard(root, 'minor'),
    }).toMatchSnapshot();
  });
});

describe('discovery note groups', () => {
  it('connects natural-note groups only on selected strings', () => {
    expect(
      computeGroupBands(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A#']), new Set([1, 6]))
    ).toEqual([
      { visualStringIndex: 0, group: 'def', startFret: 0, endFret: 1 },
      { visualStringIndex: 0, group: 'abc', startFret: 5, endFret: 8 },
      { visualStringIndex: 0, group: 'def', startFret: 10, endFret: 13 },
      { visualStringIndex: 0, group: 'abc', startFret: 17, endFret: 20 },
      { visualStringIndex: 5, group: 'def', startFret: 0, endFret: 1 },
      { visualStringIndex: 5, group: 'abc', startFret: 5, endFret: 8 },
      { visualStringIndex: 5, group: 'def', startFret: 10, endFret: 13 },
      { visualStringIndex: 5, group: 'abc', startFret: 17, endFret: 20 },
    ]);
    expect(computeGroupBands(new Set(['A']), new Set([1]))).toEqual([]);
    expect(computeGroupBands(new Set(['A', 'C']), new Set([1]))).toEqual([
      { visualStringIndex: 0, group: 'abc', startFret: 5, endFret: 8 },
      { visualStringIndex: 0, group: 'abc', startFret: 17, endFret: 20 },
    ]);
    expect(computeGroupBands(new Set(['A', 'B', 'C']), new Set())).toEqual([]);
  });
});
