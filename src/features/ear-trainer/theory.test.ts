import { describe, expect, it, vi } from 'vitest';

import {
  clampInteger,
  createExercise,
  DEFAULT_EAR_TRAINER_SETTINGS,
  degreeSemitones,
  exerciseDegrees,
  intervalOption,
  keyName,
  midiNoteLabel,
  normalizeSettings,
} from './theory';

describe('exercise settings', () => {
  it('preserves the default exercise preferences', async () => {
    vi.resetModules();
    const theory = await import('./theory');
    expect(theory.DEFAULT_EAR_TRAINER_SETTINGS).toMatchSnapshot();
  });

  it.each([
    [1, 'm2', 'Minor 2nd'],
    [2, 'M2', 'Major 2nd'],
    [3, 'm3', 'Minor 3rd'],
    [4, 'M3', 'Major 3rd'],
    [5, 'P4', 'Perfect 4th'],
    [6, 'TT', 'Tritone'],
    [7, 'P5', 'Perfect 5th'],
    [8, 'm6', 'Minor 6th'],
    [9, 'M6', 'Major 6th'],
    [10, 'm7', 'Minor 7th'],
    [11, 'M7', 'Major 7th'],
    [12, 'P8', 'Octave'],
  ] as const)('names the %i-semitone interval correctly', async (semitones, short, label) => {
    vi.resetModules();
    const theory = await import('./theory');
    expect(theory.intervalOption(semitones)).toEqual({ semitones, short, label });
  });

  it.each([
    [undefined, 2],
    [Number.NaN, 2],
    [Infinity, 2],
    ['3', 2],
    [-1, 0],
    [9, 8],
    [3.6, 4],
  ])('normalizes numeric setting %s', (input, output) => {
    expect(clampInteger(input, 0, 8, 2)).toBe(output);
  });
  it('defaults missing settings and normalizes ranges and empty directions', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_EAR_TRAINER_SETTINGS);
    expect(
      normalizeSettings({
        octaveStart: 7,
        octaveEnd: 1,
        directions: [],
        noteCount: 100,
        keyIndex: -2,
        fixedKey: true,
        playRootFirst: true,
        tone: 'warm',
      })
    ).toEqual({
      octaveStart: 1,
      octaveEnd: 7,
      directions: ['ascending', 'descending'],
      noteCount: 4,
      keyIndex: 0,
      fixedKey: true,
      playRootFirst: true,
      tone: 'warm',
    });
    expect(normalizeSettings({ alwaysPlayRoot: true } as never).playRootFirst).toBe(true);
    expect(normalizeSettings({ directions: ['ascending', 'ascending'] }).directions).toEqual([
      'ascending',
    ]);
  });
  it.each([
    ['1', 0],
    ['2', 2],
    ['3', 4],
    ['4', 5],
    ['5', 7],
    ['6', 9],
    ['7', 11],
    ['b1', 11],
    ['#7', 0],
    ['', null],
    ['8', null],
  ])('interprets degree %s', (degree, semitones) => {
    expect(degreeSemitones(degree)).toBe(semitones);
  });
  it('labels MIDI pitches, keys and intervals', () => {
    expect(keyName(3)).toBe('C');
    expect(midiNoteLabel(60)).toBe('C4');
    expect(midiNoteLabel(69)).toBe('A4');
    expect(intervalOption(6)).toEqual({ semitones: 6, short: 'TT', label: 'Tritone' });
    expect(intervalOption(13)).toBeUndefined();
    expect(
      exerciseDegrees({ keyIndex: 3, notes: [60, 64, 67], intervals: [4, 3], rootMidi: 60 })
    ).toEqual(['1', '3', '5']);
  });
});

describe('exercise generation', () => {
  it.each(
    ([['ascending'], ['descending'], ['ascending', 'descending']] as const).flatMap((directions) =>
      [false, true].map((playRootFirst) => ({ directions, playRootFirst }))
    )
  )(
    'keeps one-octave phrases inside the key roots ($directions, root first: $playRootFirst)',
    ({ directions, playRootFirst }) => {
      expect.hasAssertions();
      const lowerRoots = [57, 58, 59, 48, 49, 50, 51, 52, 53, 54, 55, 56];
      for (const [keyIndex, lowerRoot] of lowerRoots.entries()) {
        for (const noteCount of [2, 3, 4]) {
          for (const random of [() => 0, (length: number) => length - 1]) {
            const exercise = createExercise(
              {
                ...DEFAULT_EAR_TRAINER_SETTINGS,
                octaveStart: 3,
                octaveEnd: 3,
                directions,
                fixedKey: true,
                keyIndex,
                noteCount,
                playRootFirst,
              },
              random
            );
            expect(exercise.notes).toHaveLength(noteCount);
            expect(
              exercise.notes.every((note) => note >= lowerRoot && note <= lowerRoot + 12)
            ).toBe(true);
            expect(exercise.intervals.every((interval) => interval >= 1 && interval <= 12)).toBe(
              true
            );
            expect(exercise.rootMidi).toBe(playRootFirst ? exercise.notes[0] : null);
          }
        }
      }
    }
  );
  it.each([
    { root: 'lower', random: () => 0, notes: [55, 56, 57] },
    { root: 'upper', random: (length: number) => length - 1, notes: [67, 55, 67] },
  ])('can start on the $root boundary root without leaving the range', ({ random, notes }) => {
    const exercise = createExercise(
      {
        ...DEFAULT_EAR_TRAINER_SETTINGS,
        octaveStart: 3,
        octaveEnd: 3,
        fixedKey: true,
        keyIndex: 10,
        playRootFirst: true,
      },
      random
    );
    expect(exercise.notes).toEqual(notes);
    expect(exercise.rootMidi).toBe(notes[0]);
  });
  it.each([
    { directions: ['ascending'] },
    { directions: ['descending'] },
    { directions: ['ascending', 'descending'] },
  ] as const)(
    'keeps rooted phrases within the selected multi-octave range ($directions)',
    ({ directions }) => {
      expect.hasAssertions();
      for (let keyIndex = 0; keyIndex < 12; keyIndex++) {
        const exercise = createExercise(
          {
            ...DEFAULT_EAR_TRAINER_SETTINGS,
            octaveStart: 2,
            octaveEnd: 4,
            noteCount: 4,
            fixedKey: true,
            playRootFirst: true,
            keyIndex,
            directions,
          },
          (length) => length - 1
        );
        expect(exercise.notes).toHaveLength(4);
        const root = 36 + ((keyIndex + 9) % 12);
        expect(exercise.notes.every((note) => note >= root && note <= root + 36)).toBe(true);
        expect(exercise.intervals.every((interval) => interval >= 1 && interval <= 12)).toBe(true);
        expect(exercise.rootMidi).toBe(exercise.notes[0]);
        expect(exercise).toMatchSnapshot(`key ${keyIndex}`);
      }
    }
  );
  it('bounds nonzero crypto values before using them as selection indices', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0xffffffff);
      return array;
    });
    const exercise = createExercise(DEFAULT_EAR_TRAINER_SETTINGS);
    expect(exercise.keyIndex).toBe(3);
    expect(exercise.notes.every((note) => note >= 36 && note <= 60)).toBe(true);
    expect(exercise).toMatchSnapshot();
  });

  it.each(['ascending', 'descending'] as const)(
    'keeps %s phrases in range with room for every note',
    (direction) => {
      const settings = {
        ...DEFAULT_EAR_TRAINER_SETTINGS,
        octaveStart: 3,
        octaveEnd: 3,
        noteCount: 4,
        directions: [direction],
        fixedKey: true,
      };
      const exercise = createExercise(settings, () => 0);
      expect(exercise).toEqual(
        direction === 'ascending'
          ? { keyIndex: 3, notes: [48, 49, 50, 51], intervals: [1, 1, 1], rootMidi: null }
          : { keyIndex: 3, notes: [51, 50, 49, 48], intervals: [1, 1, 1], rootMidi: null }
      );
    }
  );
  it.each([
    ['ascending', 2, [59, 60, 61]],
    ['descending', 3, [60, 59, 58]],
    ['ascending', 3, [48, 49, 50]],
  ] as const)('finds a root with space in a one-octave %s range', (direction, keyIndex, notes) => {
    expect(
      createExercise(
        {
          ...DEFAULT_EAR_TRAINER_SETTINGS,
          octaveStart: 3,
          octaveEnd: 3,
          directions: [direction],
          keyIndex,
          fixedKey: true,
          playRootFirst: true,
        },
        () => 0
      )
    ).toEqual({ keyIndex, notes, intervals: [1, 1], rootMidi: notes[0] });
  });
  it('uses random key selection and the last legal choice', () => {
    const exercise = createExercise(DEFAULT_EAR_TRAINER_SETTINGS, (length) => length - 1);
    expect(exercise).toEqual({
      keyIndex: 11,
      notes: [68, 56, 44],
      intervals: [12, 12],
      rootMidi: null,
    });
  });
  it('uses crypto by default', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    expect(createExercise(DEFAULT_EAR_TRAINER_SETTINGS)).toEqual({
      keyIndex: 0,
      notes: [45, 46, 47],
      intervals: [1, 1],
      rootMidi: null,
    });
  });
});
