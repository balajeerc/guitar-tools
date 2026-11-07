import { describe, expect, it } from 'vitest';

import { getNoteAtPosition, getScaleDegree, isInScale } from './musicTheory';

describe('standard guitar tuning', () => {
  it.each([
    [0, 0, 7],
    [1, 0, 0],
    [2, 0, 5],
    [3, 0, 10],
    [4, 0, 2],
    [5, 0, 7],
    [0, 5, 0],
    [0, 12, 7],
    [5, 22, 5],
  ])('maps string %i at fret %i to pitch class %i', (string, fret, expected) => {
    expect(getNoteAtPosition(string, fret)).toBe(expected);
  });

  it.each([-1, 6])('rejects invalid string %i', (string) => {
    expect(() => getNoteAtPosition(string, 0)).toThrow(RangeError);
  });
});

describe('scale membership and degrees', () => {
  it.each([
    [3, 3, 'major', false, 0],
    [5, 3, 'major', false, 1],
    [7, 3, 'major', false, 2],
    [10, 3, 'major', false, 3],
    [0, 3, 'major', false, 4],
    [8, 3, 'major', false, -1],
    [8, 3, 'major', true, 3],
    [2, 3, 'major', true, 6],
    [4, 3, 'major', true, -1],
    [0, 0, 'minor', false, 0],
    [3, 0, 'minor', false, 1],
    [5, 0, 'minor', false, 2],
    [7, 0, 'minor', false, 3],
    [10, 0, 'minor', false, 4],
    [2, 0, 'minor', false, -1],
    [2, 0, 'minor', true, 1],
    [8, 0, 'minor', true, 5],
    [11, 0, 'minor', true, -1],
    [0, 10, 'major', true, 1],
  ] as const)('resolves note %i in root %i %s (full=%s)', (note, root, mode, full, degree) => {
    expect(getScaleDegree(note, root, mode, full)).toBe(degree);
    expect(isInScale(note, root, mode, full)).toBe(degree !== -1);
  });

  it('uses pentatonic intervals by default', () => {
    expect(isInScale(8, 3, 'major')).toBe(false);
    expect(getScaleDegree(8, 3, 'major')).toBe(-1);
    expect(isInScale(3, 0, 'minor')).toBe(true);
    expect(getScaleDegree(3, 0, 'minor')).toBe(1);
  });
});
