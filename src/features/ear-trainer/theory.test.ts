import { describe, expect, it, vi } from 'vitest';

import { requiredAt } from '../../shared/requiredAt';

import {
  clampInteger,
  createExercise,
  DEFAULT_EAR_TRAINER_SETTINGS,
  degreeSemitones,
  type EarTrainerDirection,
  type EarTrainerExercise,
  exerciseDegrees,
  intervalOption,
  keyName,
  midiNoteLabel,
  normalizeSettings,
} from './theory';

function expectPhraseDirections(
  exercise: EarTrainerExercise,
  directions: readonly EarTrainerDirection[],
  playRootFirst: boolean
): void {
  const steps = exercise.notes
    .slice(1)
    .map((note, index) => note - requiredAt(exercise.notes, index));
  const laterSteps = playRootFirst ? steps.slice(1) : steps;
  expect(
    laterSteps.every((step) => directions.includes(step > 0 ? 'ascending' : 'descending'))
  ).toBe(true);
}

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
      repeatMistakes: true,
      directions: ['ascending', 'descending'],
      noteCount: 4,
      keyIndex: 0,
      majorMinorOnly: false,
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
    [undefined, false],
    [false, false],
    [true, true],
    ['true', false],
  ])('normalizes the major/minor restriction %s', (value, expected) => {
    expect(normalizeSettings({ majorMinorOnly: value } as never).majorMinorOnly).toBe(expected);
  });
  it.each([
    { playRootFirst: false, directions: ['descending'] },
    { playRootFirst: true, directions: ['descending'] },
  ] as const)(
    'preserves descending-only mode when root-first is $playRootFirst',
    ({ playRootFirst, directions }) => {
      expect(normalizeSettings({ directions: ['descending'], playRootFirst }).directions).toEqual(
        directions
      );
    }
  );
  it('normalizes descending-only legacy root-first settings', () => {
    expect(
      normalizeSettings({ directions: ['descending'], alwaysPlayRoot: true } as never).directions
    ).toEqual(['descending']);
  });
  it.each([
    ['1', 0],
    ['2', 2],
    ['3', 4],
    ['4', 5],
    ['5', 7],
    ['6', 9],
    ['7', 11],
    ['8', 0],
    ['b8', 11],
    ['#8', 1],
    ['b1', 11],
    ['#7', 0],
    ['', null],
    ['9', null],
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
      [false, true].flatMap((playRootFirst) =>
        [false, true].map((majorMinorOnly) => ({ directions, playRootFirst, majorMinorOnly }))
      )
    )
  )(
    'keeps phrases in range ($directions, root first: $playRootFirst, major/minor: $majorMinorOnly)',
    ({ directions, playRootFirst, majorMinorOnly }) => {
      expect.hasAssertions();
      const lowerRoots = [57, 58, 59, 48, 49, 50, 51, 52, 53, 54, 55, 56];
      const excludedDegrees = majorMinorOnly ? [1, 6] : [];
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
                majorMinorOnly,
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
            expect(exercise.rootMidi).toBe(playRootFirst ? lowerRoot : null);
            expectPhraseDirections(exercise, directions, playRootFirst);
            expect(
              exercise.notes.every((note) => !excludedDegrees.includes((note - lowerRoot) % 12))
            ).toBe(true);
          }
        }
      }
    }
  );
  it('retains every major/minor degree and allows mixing them in a phrase', () => {
    const settings = {
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      octaveStart: 3,
      octaveEnd: 3,
      keyIndex: 3,
      fixedKey: true,
      majorMinorOnly: true,
    };
    const starts = Array.from({ length: 11 }, (_, selection) => {
      return createExercise(settings, (length) => selection % length).notes[0];
    });
    expect(starts).toEqual([48, 50, 51, 52, 53, 55, 56, 57, 58, 59, 60]);
    let selection = 0;
    const mixed = createExercise({ ...settings, playRootFirst: true }, () =>
      requiredAt([1, 0], selection++)
    );
    expect(exerciseDegrees(mixed)).toEqual(['1', 'b3', '3']);
  });
  it('allows chromatic degrees when the restriction is off', () => {
    let selection = 0;
    const exercise = createExercise(
      {
        ...DEFAULT_EAR_TRAINER_SETTINGS,
        octaveStart: 3,
        octaveEnd: 3,
        fixedKey: true,
        playRootFirst: true,
      },
      () => requiredAt([5, 9], selection++)
    );
    expect(exercise.notes).toEqual([48, 54, 49]);
    expect(exerciseDegrees(exercise)).toEqual(['1', 'b5', 'b2']);
  });
  it.each([
    { noteCount: 2, first: [48, 49], last: [48, 60] },
    { noteCount: 3, first: [48, 49, 48], last: [48, 60, 48] },
    { noteCount: 4, first: [48, 50, 49, 48], last: [48, 60, 49, 48] },
  ])('jumps up then descends with room for all $noteCount notes', ({ noteCount, first, last }) => {
    const settings = {
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      octaveStart: 3,
      octaveEnd: 3,
      keyIndex: 3,
      fixedKey: true,
      playRootFirst: true,
      noteCount,
      directions: ['descending'] as const,
    };
    expect(createExercise(settings, () => 0).notes).toEqual(first);
    expect(createExercise(settings, (length) => length - 1).notes).toEqual(last);
  });
  it.each([
    { selection: 'first', random: () => 0, notes: [55, 56, 57] },
    { selection: 'last', random: (length: number) => length - 1, notes: [55, 67, 55] },
  ])('starts on the lowest root with the $selection random choice', ({ random, notes }) => {
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
        expect(exercise.notes[0]).toBe(root);
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
    ['descending', 3, [48, 49, 48]],
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
