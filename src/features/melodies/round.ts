import type { Melody, MelodyDifficulty } from "./catalog";
import type { ManualAnswerBasis } from "./manualGuess";
import { createMelodyMatcher, type MelodyMatcher } from "./matcher";
import { createNoteGate, type NoteGate } from "./noteGate";

export type GuessMethod = "microphone" | "manual";
type RoundStatus = "ready" | "guessing" | "complete" | "revealed";

export interface RoundState {
  melody: Melody;
  matcher: MelodyMatcher;
  gate: NoteGate;
  status: RoundStatus;
  elapsedMs: number;
  startedAt: number;
  round: number;
  previousMidi: number | null;
  method: GuessMethod;
  difficulty: MelodyDifficulty;
  micMatchedNotes: number;
  manualInput: readonly string[];
  manualJudgement: readonly boolean[] | null;
  manualAnswerBasis: ManualAnswerBasis;
  hasPlayed: boolean;
  microphoneActive: boolean;
  playing: boolean;
}

export function createRound(melody: Melody, round: number, method: GuessMethod): RoundState {
  return {
    melody,
    matcher: createMelodyMatcher(melody.notes.map(({ midi }) => midi)),
    gate: createNoteGate(),
    status: "ready",
    elapsedMs: 0,
    startedAt: 0,
    round,
    previousMidi: null,
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
