import { describe, expect, it } from 'vitest';

import { requiredAt } from '../../shared/requiredAt';

import { getNearestTriadGroupings, getProgressionChord, progressionStepLabel } from './grouping';
import { getOrbitNotes, getTriadShapes, TRIAD_STRING_SETS } from './shapes';

const roots = [0, 3, 7, 11];
const qualities = ['major', 'minor', 'diminished'] as const;
const examples = roots.flatMap((root) =>
  qualities.flatMap((quality) => TRIAD_STRING_SETS.map((strings) => ({ root, quality, strings })))
);

describe('triad voicings', () => {
  it.each(examples)(
    'lays out root $root $quality on $strings.label',
    ({ root, quality, strings }) => {
      const shapes = getTriadShapes(root, quality, strings);
      expect(shapes.length).toBeGreaterThan(0);
      expect(
        shapes.map((shape) => ({ ...shape, orbit: getOrbitNotes(shape, quality) }))
      ).toMatchSnapshot();
      expect(
        shapes.flatMap((shape) => shape.notes).every((note) => note.fret >= 0 && note.fret <= 22)
      ).toBe(true);
      expect(new Set(shapes.map((shape) => shape.inversion))).toEqual(
        new Set(['root', 'first', 'second'])
      );
    }
  );
  it('omits orbit notes beyond either fretboard edge', () => {
    const shape = {
      centerFret: 11,
      id: 'edge',
      inversion: 'root',
      notes: [
        { degree: 'root', stringIdx: 0, fret: 0 },
        { degree: 'fifth', stringIdx: 1, fret: 22 },
      ],
    } as const;
    expect(getOrbitNotes(shape, 'major')).toEqual([]);
  });
  it('resolves progression labels and key-relative chord roots', () => {
    expect(progressionStepLabel({ degree: 4, quality: 'major' })).toBe('IV');
    expect(progressionStepLabel({ degree: 3, quality: 'minor' })).toBe('iii');
    expect(progressionStepLabel({ degree: 7, quality: 'diminished' })).toBe('vii°');
    expect(getProgressionChord(10, 'major', { degree: 5, quality: 'major' })).toEqual({
      degree: 5,
      quality: 'major',
      rootIndex: 5,
    });
    expect(getProgressionChord(0, 'minor', { degree: 3, quality: 'major' })).toEqual({
      degree: 3,
      quality: 'major',
      rootIndex: 3,
    });
  });
  it('finds compact closed-loop voicings around each anchor', () => {
    const strings = requiredAt(TRIAD_STRING_SETS, 0);
    const chords = [1, 4, 5, 1].map((degree) =>
      getProgressionChord(3, 'major', { degree: degree as 1 | 4 | 5, quality: 'major' })
    );
    expect(getNearestTriadGroupings(chords, strings)).toMatchSnapshot();
    expect(getNearestTriadGroupings([], strings)).toEqual([]);
  });
});
