import { requiredAt } from '../../shared/requiredAt';
// Pure music theory for the Circle of Fifths: key spelling and diatonic chords.

/** Natural letter names in scale order, and their pitch classes above C. */
const LETTERS = 'CDEFGAB';
const LETTER_PITCH_CLASSES: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

const SHARP = '♯';
const FLAT = '♭';

/** Semitones above the tonic for each degree of the major / natural minor scale. */
const MAJOR_STEPS: readonly number[] = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS: readonly number[] = [0, 2, 3, 5, 7, 8, 10];

type TriadQuality = 'diminished' | 'major' | 'minor';

/** Triad quality of each scale degree, in degree order. */
const MAJOR_QUALITIES: readonly TriadQuality[] = [
  'major',
  'minor',
  'minor',
  'major',
  'major',
  'minor',
  'diminished',
];
const MINOR_QUALITIES: readonly TriadQuality[] = [
  'minor',
  'diminished',
  'major',
  'minor',
  'minor',
  'major',
  'major',
];

const CHORD_SUFFIX: Record<TriadQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
};

const ROMAN_NUMERALS: readonly string[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const DEGREE_COUNT = ROMAN_NUMERALS.length;

export type KeyMode = 'major' | 'minor';

export interface Chord {
  readonly name: string;
  readonly numeral: string;
}

/** Net accidental offset of a note name, e.g. "E♭" → -1. */
function accidentalOffset(name: string): number {
  let offset = 0;
  for (const char of name.slice(1)) {
    if (char === SHARP) offset += 1;
    if (char === FLAT) offset -= 1;
  }
  return offset;
}

function pitchClass(name: string): number {
  const letterIndex = LETTERS.indexOf(requiredAt(name, 0));
  return (requiredAt(LETTER_PITCH_CLASSES, letterIndex) + accidentalOffset(name) + 12) % 12;
}

/**
 * Spell a scale so every degree gets its own letter name — G♭ major spells its
 * 4th as C♭, not B. The accidental for a degree is the gap between the pitch
 * that degree needs and the natural pitch of the letter it has to use.
 */
function spellScale(tonic: string, steps: readonly number[]): string[] {
  const rootLetter = LETTERS.indexOf(requiredAt(tonic, 0));
  const rootPitch = pitchClass(tonic);

  return steps.map((step, degree) => {
    const letterIndex = (rootLetter + degree) % 7;
    const natural = requiredAt(LETTER_PITCH_CLASSES, letterIndex);
    const target = (rootPitch + step) % 12;
    // Wrap into [-6, 5] so a degree is spelled with a ♯/♭ rather than 11 flats.
    const accidental = ((target - natural + 18) % 12) - 6;
    const symbol = accidental > 0 ? SHARP : FLAT;
    return requiredAt(LETTERS, letterIndex) + symbol.repeat(Math.abs(accidental));
  });
}

/**
 * Numerals follow the usual figured-bass convention: upper case for a major
 * triad, lower case for minor, and a ° ring for diminished.
 */
function formatNumeral(base: string, quality: TriadQuality): string {
  if (quality === 'major') return base;
  return base.toLowerCase() + (quality === 'diminished' ? '°' : '');
}

/** The seven degree numerals of a mode, cased by triad quality. */
export function getDegreeNumerals(mode: KeyMode): string[] {
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES;
  return qualities.map((quality, degree) =>
    formatNumeral(requiredAt(ROMAN_NUMERALS, degree), quality)
  );
}

/** The seven diatonic triads of a key, in degree order. */
export function getDiatonicChords(tonic: string, mode: KeyMode): Chord[] {
  const steps = mode === 'major' ? MAJOR_STEPS : MINOR_STEPS;
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES;
  const numerals = getDegreeNumerals(mode);

  return spellScale(tonic, steps).map((root, degree) => ({
    numeral: requiredAt(numerals, degree),
    name: root + CHORD_SUFFIX[requiredAt(qualities, degree)],
  }));
}
