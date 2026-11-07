import { describe, expect, it, vi } from 'vitest';

describe('fretboard and music constants', () => {
  it('preserves the physical board, tuning, scales and note names', async () => {
    vi.resetModules();
    const { getNoteName, ...configuration } = await import('./constants');
    expect(configuration).toMatchSnapshot();
    expect(Array.from({ length: 12 }, (_, index) => getNoteName(index, 'sharp'))).toEqual([
      'A',
      'A#',
      'B',
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
    ]);
    expect(Array.from({ length: 12 }, (_, index) => getNoteName(index, 'flat'))).toEqual([
      'A',
      'Bb',
      'B',
      'C',
      'Db',
      'D',
      'Eb',
      'E',
      'F',
      'Gb',
      'G',
      'Ab',
    ]);
  });
});
