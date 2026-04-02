// Map detected frequency to the nearest musical note

import { NOTES } from "../../shared/constants";

/** A4 reference frequency in Hz */
const A4_FREQUENCY = 440;

/** A4 MIDI note number */
const A4_MIDI = 69;

/** Note index of A in the NOTES array (A=0) */
const A_NOTE_INDEX = 0;

/** Minimum detectable frequency (roughly E2 ~82Hz) */
const MIN_FREQUENCY = 75;

/** Maximum detectable frequency (roughly E6 ~1319Hz) */
const MAX_FREQUENCY = 1400;

export interface DetectedNote {
  /** Note name (e.g. "A", "C#") */
  name: string;
  /** Note index in the NOTES array (0-11) */
  noteIndex: number;
  /** MIDI note number (encodes both note name and octave) */
  midiNote: number;
  /** How many cents off from the exact note (-50 to +50) */
  centsOff: number;
}

/**
 * Convert a frequency in Hz to the nearest note.
 * @param frequency - Detected frequency in Hz
 * @returns The closest note, or null if frequency is out of guitar range
 */
export function frequencyToNote(frequency: number): DetectedNote | null {
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null;

  // Number of semitones from A4
  const semitonesFromA4 = 12 * Math.log2(frequency / A4_FREQUENCY);

  // Round to nearest semitone
  const roundedSemitones = Math.round(semitonesFromA4);

  // Cents deviation from the nearest note
  const centsOff = Math.round((semitonesFromA4 - roundedSemitones) * 100);

  // Map to note index (0-11), wrapping into our NOTES array
  const noteIndex = ((roundedSemitones + A_NOTE_INDEX) % 12 + 12) % 12;

  // MIDI note number (A4 = 69)
  const midiNote = A4_MIDI + roundedSemitones;

  return {
    name: NOTES[noteIndex],
    noteIndex,
    midiNote,
    centsOff,
  };
}
