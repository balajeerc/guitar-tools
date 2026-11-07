import { requiredAt } from '../../shared/requiredAt';

import type { Melody, MelodyNote } from './catalogTypes';

export const note = (midi: number, beats = 1): MelodyNote => ({ midi, beats });

export function phrase(pitches: readonly number[], rhythm: readonly number[]): MelodyNote[] {
  if (pitches.length !== rhythm.length) throw new Error('A melody needs one beat value per pitch');
  return pitches.map((midi, index) => note(midi, rhythm[index]));
}

const CHROMATIC_DEGREES = [
  '1',
  'b2',
  '2',
  'b3',
  '3',
  '4',
  'b5',
  '5',
  'b6',
  '6',
  'b7',
  '7',
] as const;

interface PhraseDefinition extends Omit<Melody, 'degrees' | 'notes'> {
  pitches: readonly number[];
  rhythm: readonly number[];
  tonic: number;
}

export function melody(definition: PhraseDefinition): Melody {
  const { pitches, tonic, rhythm, ...details } = definition;
  const degrees = pitches.map((midi) =>
    requiredAt(CHROMATIC_DEGREES, (((midi - tonic) % 12) + 12) % 12)
  );
  return { ...details, notes: phrase(pitches, rhythm), degrees };
}
