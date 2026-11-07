import { describe, expect, it } from 'vitest';

import { frequencyToNote } from './noteMapper';

describe('frequency to note conversion', () => {
  it.each([
    [440, 'A', 0, 69],
    [220, 'A', 0, 57],
    [880, 'A', 0, 81],
    [440 * 2 ** (-29 / 12), 'E', 7, 40],
    [440 * 2 ** (-9 / 12), 'C', 3, 60],
    [466.163762, 'A#', 1, 70],
    [415.304698, 'G#', 11, 68],
  ])('maps %f Hz to %s', (frequency, name, noteIndex, midiNote) => {
    expect(frequencyToNote(frequency)).toEqual({ name, noteIndex, midiNote, centsOff: 0 });
  });

  it.each([
    [440 * 2 ** (25 / 1200), 25],
    [440 * 2 ** (-25 / 1200), -25],
    [440 * 2 ** (49 / 1200), 49],
  ])('measures cents deviation at %f Hz', (frequency, centsOff) => {
    expect(frequencyToNote(frequency)).toEqual({ name: 'A', noteIndex: 0, midiNote: 69, centsOff });
  });

  it.each([0, -440, 74.999, 1400.001, Number.NaN, Infinity, -Infinity])(
    'rejects an invalid or out-of-range frequency %f',
    (frequency) => {
      expect(frequencyToNote(frequency)).toBeNull();
    }
  );

  it.each([
    [75, 'D', 5, 38, 37],
    [1400, 'F', 8, 89, 4],
  ])('includes the boundary frequency %f Hz', (frequency, name, noteIndex, midiNote, centsOff) => {
    expect(frequencyToNote(frequency)).toEqual({ name, noteIndex, midiNote, centsOff });
  });
});
