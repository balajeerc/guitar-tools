import { getNoteName } from "../../shared/constants";
import { degreesFromTonic } from "../melodies/manualGuess";
import type { MelodyTone } from "../melodies/tone";

export const MIN_OCTAVE = 0;
export const MAX_OCTAVE = 8;
export const MIN_NOTE_COUNT = 2;
export const MAX_NOTE_COUNT = 4;

export type EarTrainerDirection = "ascending" | "descending";

const DIRECTIONS: readonly EarTrainerDirection[] = ["ascending", "descending"];

export interface EarTrainerSettings {
  octaveStart: number;
  octaveEnd: number;
  noteCount: number;
  directions: readonly EarTrainerDirection[];
  playRootFirst: boolean;
  fixedKey: boolean;
  keyIndex: number;
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
  tone: "pluck",
};

export interface IntervalOption {
  semitones: number;
  short: string;
  label: string;
}

const INTERVALS: readonly IntervalOption[] = [
  { semitones: 1, short: "m2", label: "Minor 2nd" },
  { semitones: 2, short: "M2", label: "Major 2nd" },
  { semitones: 3, short: "m3", label: "Minor 3rd" },
  { semitones: 4, short: "M3", label: "Major 3rd" },
  { semitones: 5, short: "P4", label: "Perfect 4th" },
  { semitones: 6, short: "TT", label: "Tritone" },
  { semitones: 7, short: "P5", label: "Perfect 5th" },
  { semitones: 8, short: "m6", label: "Minor 6th" },
  { semitones: 9, short: "M6", label: "Major 6th" },
  { semitones: 10, short: "m7", label: "Minor 7th" },
  { semitones: 11, short: "M7", label: "Major 7th" },
  { semitones: 12, short: "P8", label: "Octave" },
];

export interface EarTrainerExercise {
  notes: readonly number[];
  intervals: readonly number[];
  rootMidi: number | null;
  keyIndex: number;
}

type RandomIndex = (length: number) => number;

function randomIndex(length: number): number {
  if (length <= 0) return 0;
  return crypto.getRandomValues(new Uint32Array(1))[0] % length;
}

export function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(numeric)));
}

function normalizedOctaves(value: Partial<EarTrainerSettings> | null): {
  octaveStart: number;
  octaveEnd: number;
} {
  const start = clampInteger(
    value?.octaveStart, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_EAR_TRAINER_SETTINGS.octaveStart,
  );
  const end = clampInteger(
    value?.octaveEnd, MIN_OCTAVE, MAX_OCTAVE, DEFAULT_EAR_TRAINER_SETTINGS.octaveEnd,
  );
  return { octaveStart: Math.min(start, end), octaveEnd: Math.max(start, end) };
}

function normalizedDirections(value: Partial<EarTrainerSettings> | null): EarTrainerDirection[] {
  const stored = value?.directions;
  if (!Array.isArray(stored)) return [...DIRECTIONS];
  const directions = DIRECTIONS.filter((direction) => stored.includes(direction));
  return directions.length > 0 ? directions : [...DIRECTIONS];
}

function normalizedPlayRootFirst(value: Partial<EarTrainerSettings> | null): boolean {
  const legacyRootFirst = (value as { alwaysPlayRoot?: unknown } | null)?.alwaysPlayRoot;
  return value?.playRootFirst === true || legacyRootFirst === true;
}

export function normalizeSettings(value: Partial<EarTrainerSettings> | null): EarTrainerSettings {
  return {
    ...normalizedOctaves(value),
    noteCount: clampInteger(
      value?.noteCount, MIN_NOTE_COUNT, MAX_NOTE_COUNT, DEFAULT_EAR_TRAINER_SETTINGS.noteCount,
    ),
    directions: normalizedDirections(value),
    playRootFirst: normalizedPlayRootFirst(value),
    fixedKey: value?.fixedKey === true,
    keyIndex: clampInteger(value?.keyIndex, 0, 11, DEFAULT_EAR_TRAINER_SETTINGS.keyIndex),
    tone: value?.tone ?? DEFAULT_EAR_TRAINER_SETTINGS.tone,
  };
}

export function keyName(keyIndex: number): string {
  return getNoteName(keyIndex, "sharp");
}

export function midiNoteLabel(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  // MIDI pitch class 0 is C, while NOTES starts at A; offset by three semitones.
  return `${getNoteName((midi + 3) % 12, "sharp")}${octave}`;
}

export function intervalOption(semitones: number): IntervalOption | undefined {
  return INTERVALS.find((option) => option.semitones === semitones);
}

export function exerciseDegrees(exercise: EarTrainerExercise): readonly string[] {
  const tonicPitchClass = (exercise.keyIndex + 9) % 12;
  return degreesFromTonic(exercise.notes, tonicPitchClass);
}

function naturalDegreeSemitones(digit: string): number | null {
  switch (digit) {
    case "1":
      return 0;
    case "2":
      return 2;
    case "3":
      return 4;
    case "4":
      return 5;
    case "5":
      return 7;
    case "6":
      return 9;
    case "7":
      return 11;
    default:
      return null;
  }
}

function accidentalOffset(degree: string): number {
  if (degree.startsWith("b")) return -1;
  if (degree.startsWith("#")) return 1;
  return 0;
}

export function degreeSemitones(degree: string): number | null {
  if (degree.length === 0) return null;
  const natural = naturalDegreeSemitones(degree.charAt(degree.length - 1));
  if (natural === null) return null;
  return (natural + accidentalOffset(degree) + 12) % 12;
}

function keyPitchClass(keyIndex: number): number {
  return (keyIndex + 9) % 12;
}

function octaveRange(start: number, end: number): { low: number; high: number } {
  return { low: (start + 1) * 12, high: (end + 1) * 12 + 11 };
}

interface NoteBounds {
  low: number;
  high: number;
}

function rootMidiForOctave(keyIndex: number, octave: number): number {
  return (octave + 1) * 12 + keyPitchClass(keyIndex);
}

function rootMidis(keyIndex: number, octaveStart: number, octaveEnd: number): number[] {
  return Array.from(
    { length: octaveEnd - octaveStart + 1 },
    (_, index) => rootMidiForOctave(keyIndex, octaveStart + index),
  );
}

function randomNote(low: number, high: number, random: RandomIndex): number {
  return low + random(high - low + 1);
}

function startLimits(
  range: NoteBounds, directions: readonly EarTrainerDirection[], noteCount: number,
): NoteBounds {
  const ascendingOnly = directions.length === 1 && directions[0] === "ascending";
  const descendingOnly = directions.length === 1 && directions[0] === "descending";
  return {
    low: descendingOnly ? range.low + noteCount - 1 : range.low,
    high: ascendingOnly ? range.high - noteCount + 1 : range.high,
  };
}

function chooseRoot(
  settings: EarTrainerSettings,
  keyIndex: number,
  range: NoteBounds,
  random: RandomIndex,
): { start: number; bounds: NoteBounds } {
  const limits = startLimits(range, settings.directions, settings.noteCount);
  const roots = rootMidis(keyIndex, settings.octaveStart, settings.octaveEnd)
    .filter((root) => root >= limits.low && root <= limits.high);
  if (roots.length > 0) {
    return { start: roots[random(roots.length)], bounds: range };
  }
  // A one-octave range can leave no root with room to move in the chosen direction.
  // Use the adjacent root octave so the phrase still starts on the root and moves correctly.
  const ascendingOnly = settings.directions.length === 1 && settings.directions[0] === "ascending";
  const fallbackOctave = ascendingOnly ? settings.octaveStart - 1 : settings.octaveEnd + 1;
  const fallbackRoots = rootMidis(keyIndex, fallbackOctave, fallbackOctave)
    .filter((root) => root >= 0 && root <= 127);
  const start = fallbackRoots.length > 0
    ? fallbackRoots[random(fallbackRoots.length)]
    : randomNote(limits.low, limits.high, random);
  return {
    start,
    bounds: { low: Math.min(range.low, start), high: Math.max(range.high, start) },
  };
}

function chooseStart(
  settings: EarTrainerSettings,
  keyIndex: number,
  range: NoteBounds,
  random: RandomIndex,
): { start: number; bounds: NoteBounds } {
  if (settings.playRootFirst) return chooseRoot(settings, keyIndex, range, random);
  const limits = startLimits(range, settings.directions, settings.noteCount);
  return { start: randomNote(limits.low, limits.high, random), bounds: range };
}

function nextNoteChoices(
  current: number,
  bounds: NoteBounds,
  directions: readonly EarTrainerDirection[],
  remaining: number,
): number[] {
  const both = directions.length > 1;
  const high = both ? bounds.high : bounds.high - remaining;
  const low = both ? bounds.low : bounds.low + remaining;
  const choices: number[] = [];
  for (const semitones of Array.from({ length: 12 }, (_, index) => index + 1)) {
    if (directions.includes("ascending") && current + semitones <= high) {
      choices.push(current + semitones);
    }
    if (directions.includes("descending") && current - semitones >= low) {
      choices.push(current - semitones);
    }
  }
  return choices;
}

function nextNote(
  current: number,
  bounds: NoteBounds,
  directions: readonly EarTrainerDirection[],
  remaining: number,
  random: RandomIndex,
): number {
  const choices = nextNoteChoices(current, bounds, directions, remaining);
  return choices[random(choices.length)] ?? current;
}

function buildNotes(
  settings: EarTrainerSettings,
  keyIndex: number,
  range: NoteBounds,
  random: RandomIndex,
): number[] {
  const { start, bounds } = chooseStart(settings, keyIndex, range, random);
  const notes = [start];
  while (notes.length < settings.noteCount) {
    const remaining = settings.noteCount - notes.length - 1;
    const current = notes[notes.length - 1];
    notes.push(nextNote(current, bounds, settings.directions, remaining, random));
  }
  return notes;
}

export function createExercise(
  settings: EarTrainerSettings,
  random: RandomIndex = randomIndex,
): EarTrainerExercise {
  const range = octaveRange(settings.octaveStart, settings.octaveEnd);
  const keyIndex = settings.fixedKey ? settings.keyIndex : random(12);
  const notes = buildNotes(settings, keyIndex, range, random);

  return {
    notes,
    intervals: notes.slice(1).map((note, index) => Math.abs(note - notes[index])),
    rootMidi: settings.playRootFirst ? notes[0] : null,
    keyIndex,
  };
}
