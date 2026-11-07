import { createMelodyMatcher, type MelodyMatcher } from './matcher';
import { createNoteGate, type NoteGate } from './noteGate';

import type { Melody, MelodyDifficulty } from './catalog';
import type { ManualAnswerBasis } from './manualGuess';

export type GuessMethod = 'manual' | 'microphone';
type RoundStatus = 'complete' | 'guessing' | 'ready' | 'revealed';

export interface RoundState {
  difficulty: MelodyDifficulty;
  elapsedMs: number;
  gate: NoteGate;
  hasPlayed: boolean;
  manualAnswerBasis: ManualAnswerBasis;
  manualInput: readonly string[];
  manualJudgement: null | readonly boolean[];
  matcher: MelodyMatcher;
  melody: Melody;
  method: GuessMethod;
  micMatchedNotes: number;
  microphoneActive: boolean;
  playing: boolean;
  round: number;
  startedAt: number;
  status: RoundStatus;
}

export function createRound(melody: Melody, round: number, method: GuessMethod): RoundState {
  return {
    melody,
    matcher: createMelodyMatcher(melody.notes.map(({ midi }) => midi)),
    gate: createNoteGate(),
    status: 'ready',
    elapsedMs: 0,
    startedAt: 0,
    round,
    method,
    difficulty: melody.difficulty,
    micMatchedNotes: 0,
    manualInput: [],
    manualJudgement: null,
    manualAnswerBasis: null,
    hasPlayed: false,
    microphoneActive: false,
    playing: false,
  };
}
