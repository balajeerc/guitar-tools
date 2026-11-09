import { getNoteName } from '../../shared/constants';
import { requiredAt } from '../../shared/requiredAt';
import { degreesFromTonic } from '../melodies/manualGuess';

import type { MelodyTone } from '../melodies/tone';

export const MIN_OCTAVE = 0;
export const MAX_OCTAVE = 8;
export const MIN_NOTE_COUNT = 2;
export const MAX_NOTE_COUNT = 4;

export type EarTrainerDirection = 'ascending' | 'descending';

const DIRECTIONS: readonly EarTrainerDirection[] = ['ascending', 'descending'];
const MAJOR_MINOR_SEMITONES: readonly number[] = [0, 2, 3, 4, 5, 7, 8, 9, 10, 11];

export interface EarTrainerSettings {
  directions: readonly EarTrainerDirection[];
  fixedKey: boolean;
  keyIndex: number;
  majorMinorOnly: boolean;
  noteCount: number;
  octaveEnd: number;
  octaveStart: number;
  playRootFirst: boolean;
  tone: MelodyTone;
}

export const DEFAULT_EAR_TRAINER_SETTINGS: EarTrainerSettings = {
  octaveStart: 2,
  octaveEnd: 3,
  noteCount: 3,
  directions: DIRECTIONS,
  playRootFirst: false,
  fixedKey: false,
  keyIndex: 3,
  majorMinorOnly: false,
  tone: 'pluck',
};

interface IntervalOption {
  label: string;
  semitones: number;
  short: string;
}

const INTERVALS: readonly IntervalOption[] = [
  { semitones: 1, short: 'm2', label: 'Minor 2nd' },
  { semitones: 2, short: 'M2', label: 'Major 2nd' },
  { semitones: 3, short: 'm3', label: 'Minor 3rd' },
  { semitones: 4, short: 'M3', label: 'Major 3rd' },
  { semitones: 5, short: 'P4', label: 'Perfect 4th' },
  { semitones: 6, short: 'TT', label: 'Tritone' },
  { semitones: 7, short: 'P5', label: 'Perfect 5th' },
  { semitones: 8, short: 'm6', label: 'Minor 6th' },
  { semitones: 9, short: 'M6', label: 'Major 6th' },
  { semitones: 10, short: 'm7', label: 'Minor 7th' },
  { semitones: 11, short: 'M7', label: 'Major 7th' },
  { semitones: 12, short: 'P8', label: 'Octave' },
];

export interface EarTrainerExercise {
  intervals: readonly number[];
  keyIndex: number;
  notes: readonly number[];
  rootMidi: null | number;
}

type RandomIndex = (length: number) => number;

function randomIndex(length: number): number {
  if (length <= 0) return 0;
  return requiredAt(crypto.getRandomValues(new Uint32Array(1)), 0) % length;
}

export function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  const numeric = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(numeric)));
}

function normalizedOctaves(value: null | Partial<EarTrainerSettings>): {
  octaveEnd: number;
  octaveStart: number;
} {
  const start = clampInteger(
    value?.octaveStart,
    MIN_OCTAVE,
    MAX_OCTAVE,
    DEFAULT_EAR_TRAINER_SETTINGS.octaveStart
  );
  const end = clampInteger(
    value?.octaveEnd,
    MIN_OCTAVE,
    MAX_OCTAVE,
    DEFAULT_EAR_TRAINER_SETTINGS.octaveEnd
  );
  return { octaveStart: Math.min(start, end), octaveEnd: Math.max(start, end) };
}

function normalizedDirections(value: null | Partial<EarTrainerSettings>): EarTrainerDirection[] {
  const stored = value?.directions;
  if (!Array.isArray(stored)) return [...DIRECTIONS];
  const directions = DIRECTIONS.filter((direction) => stored.includes(direction));
  return directions.length > 0 ? directions : [...DIRECTIONS];
}

function normalizedPlayRootFirst(value: null | Partial<EarTrainerSettings>): boolean {
  const legacyRootFirst = (value as null | { alwaysPlayRoot?: unknown })?.alwaysPlayRoot;
  return value?.playRootFirst === true || legacyRootFirst === true;
}

export function normalizeSettings(value: null | Partial<EarTrainerSettings>): EarTrainerSettings {
  return {
    ...normalizedOctaves(value),
    noteCount: clampInteger(
      value?.noteCount,
      MIN_NOTE_COUNT,
      MAX_NOTE_COUNT,
      DEFAULT_EAR_TRAINER_SETTINGS.noteCount
    ),
    directions: normalizedDirections(value),
    playRootFirst: normalizedPlayRootFirst(value),
    fixedKey: value?.fixedKey === true,
    keyIndex: clampInteger(value?.keyIndex, 0, 11, DEFAULT_EAR_TRAINER_SETTINGS.keyIndex),
    majorMinorOnly: value?.majorMinorOnly === true,
    tone: value?.tone ?? DEFAULT_EAR_TRAINER_SETTINGS.tone,
  };
}

export function keyName(keyIndex: number): string {
  return getNoteName(keyIndex, 'sharp');
}

export function midiNoteLabel(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  // MIDI pitch class 0 is C, while NOTES starts at A; offset by three semitones.
  return `${getNoteName((midi + 3) % 12, 'sharp')}${octave}`;
}

export function intervalOption(semitones: number): IntervalOption | undefined {
  return INTERVALS.find((option) => option.semitones === semitones);
}

export function exerciseDegrees(exercise: EarTrainerExercise): readonly string[] {
  const tonicPitchClass = (exercise.keyIndex + 9) % 12;
  return degreesFromTonic(exercise.notes, tonicPitchClass);
}

function naturalDegreeSemitones(digit: string): null | number {
  switch (digit) {
    case '1':
      return 0;
    case '2':
      return 2;
    case '3':
      return 4;
    case '4':
      return 5;
    case '5':
      return 7;
    case '6':
      return 9;
    case '7':
      return 11;
    default:
      return null;
  }
}

function accidentalOffset(degree: string): number {
  if (degree.startsWith('b')) return -1;
  if (degree.startsWith('#')) return 1;
  return 0;
}

export function degreeSemitones(degree: string): null | number {
  if (degree.length === 0) return null;
  const natural = naturalDegreeSemitones(degree.charAt(degree.length - 1));
  if (natural === null) return null;
  return (natural + accidentalOffset(degree) + 12) % 12;
}

function keyPitchClass(keyIndex: number): number {
  return (keyIndex + 9) % 12;
}

function octaveRange(
  start: number,
  end: number,
  keyIndex: number,
  majorMinorOnly: boolean
): NoteRange {
  const low = rootMidiForOctave(keyIndex, start);
  const high = rootMidiForOctave(keyIndex, end + 1);
  const notes = Array.from({ length: high - low + 1 }, (_, index) => low + index).filter(
    (note) => !majorMinorOnly || MAJOR_MINOR_SEMITONES.includes((note - low) % 12)
  );
  return { low, high, notes };
}

interface NoteBounds {
  high: number;
  low: number;
}

interface NoteRange extends NoteBounds {
  notes: readonly number[];
}

function rootMidiForOctave(keyIndex: number, octave: number): number {
  return (octave + 1) * 12 + keyPitchClass(keyIndex);
}

function randomNote(notes: readonly number[], random: RandomIndex): number {
  return requiredAt(notes, random(notes.length));
}

function startLimits(
  range: NoteRange,
  directions: readonly EarTrainerDirection[],
  noteCount: number
): NoteBounds {
  const ascendingOnly = directions.length === 1 && directions[0] === 'ascending';
  const descendingOnly = directions.length === 1 && directions[0] === 'descending';
  return {
    low: descendingOnly ? requiredAt(range.notes, noteCount - 1) : range.low,
    high: ascendingOnly ? requiredAt(range.notes, range.notes.length - noteCount) : range.high,
  };
}

function chooseStart(settings: EarTrainerSettings, range: NoteRange, random: RandomIndex): number {
  if (settings.playRootFirst) return range.low;
  const limits = startLimits(range, settings.directions, settings.noteCount);
  const choices = range.notes.filter((note) => note >= limits.low && note <= limits.high);
  return randomNote(choices, random);
}

function nextNoteChoices(
  current: number,
  bounds: NoteRange,
  directions: readonly EarTrainerDirection[],
  remaining: number
): number[] {
  const both = directions.length > 1;
  const high = both ? bounds.high : requiredAt(bounds.notes, bounds.notes.length - remaining - 1);
  const low = both ? bounds.low : requiredAt(bounds.notes, remaining);
  const choices: number[] = [];
  for (const semitones of Array.from({ length: 12 }, (_, index) => index + 1)) {
    if (
      directions.includes('ascending') &&
      current + semitones <= high &&
      bounds.notes.includes(current + semitones)
    ) {
      choices.push(current + semitones);
    }
    if (
      directions.includes('descending') &&
      current - semitones >= low &&
      bounds.notes.includes(current - semitones)
    ) {
      choices.push(current - semitones);
    }
  }
  return choices;
}

function nextNote(
  current: number,
  bounds: NoteRange,
  directions: readonly EarTrainerDirection[],
  remaining: number,
  random: RandomIndex
): number {
  const choices = nextNoteChoices(current, bounds, directions, remaining);
  return choices[random(choices.length)] ?? current;
}

function buildNotes(settings: EarTrainerSettings, range: NoteRange, random: RandomIndex): number[] {
  const start = chooseStart(settings, range, random);
  const notes = [start];
  if (
    settings.playRootFirst &&
    settings.directions.length === 1 &&
    settings.directions[0] === 'descending'
  ) {
    // Leave an available scale note for each subsequent downward step.
    const choices = range.notes
      .slice(Math.max(1, settings.noteCount - 2))
      .filter((note) => note <= start + 12);
    notes.push(randomNote(choices, random));
  }
  while (notes.length < settings.noteCount) {
    const remaining = settings.noteCount - notes.length - 1;
    const current = requiredAt(notes, notes.length - 1);
    notes.push(nextNote(current, range, settings.directions, remaining, random));
  }
  return notes;
}

export function createExercise(
  preferences: EarTrainerSettings,
  random: RandomIndex = randomIndex
): EarTrainerExercise {
  const settings = normalizeSettings(preferences);
  const keyIndex = settings.fixedKey ? settings.keyIndex : random(12);
  const range = octaveRange(
    settings.octaveStart,
    settings.octaveEnd,
    keyIndex,
    settings.majorMinorOnly
  );
  const notes = buildNotes(settings, range, random);

  return {
    notes,
    intervals: notes.slice(1).map((note, index) => Math.abs(note - requiredAt(notes, index))),
    rootMidi: settings.playRootFirst ? requiredAt(notes, 0) : null,
    keyIndex,
  };
}
