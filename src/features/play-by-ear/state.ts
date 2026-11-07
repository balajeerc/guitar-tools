import { loadPersisted } from '../../shared/persist';
import { requiredAt } from '../../shared/requiredAt';
import { createNoteGate } from '../melodies/noteGate';

import { EAR_TRAINING_SONGS } from './catalog';
import { createHeardNoteQueue } from './heardNoteQueue';
import { createSlidingMelodyMatcher } from './slidingMatcher';

import type { MelodyMatcher } from '../melodies/matcher';
import type { NoteGate } from '../melodies/noteGate';
import type { HeardNoteQueue } from './heardNoteQueue';

export type GuessMethod = 'manual' | 'microphone';
type GameStatus = 'complete' | 'guessing' | 'ready' | 'revealed';

export interface GameState {
  gate: NoteGate;
  hasListened: boolean;
  heardNotes: HeardNoteQueue;
  manualInput: readonly string[];
  manualJudgement: null | readonly boolean[];
  matchedNotes: number;
  matcher: MelodyMatcher;
  method: GuessMethod;
  playerLoading: boolean;
  sectionIndex: number;
  songIndex: number;
  status: GameStatus;
  videoLooping: boolean;
}

export function createGameState(
  songIndex: number,
  sectionIndex: number,
  method: GuessMethod,
  options: { autoClearNotes: boolean; onAutoClear: () => void }
): GameState {
  const section = requiredAt(requiredAt(EAR_TRAINING_SONGS, songIndex).sections, sectionIndex);
  return {
    songIndex,
    sectionIndex,
    status: 'ready',
    method,
    hasListened: false,
    videoLooping: false,
    playerLoading: false,
    matcher: createSlidingMelodyMatcher(section.notes),
    gate: createNoteGate({ stableNoteMs: 50 }),
    matchedNotes: 0,
    manualInput: [],
    manualJudgement: null,
    heardNotes: createHeardNoteQueue(
      section.notes.length,
      5000,
      options.autoClearNotes,
      options.onAutoClear
    ),
  };
}

export function loadPlayByEarMethod(): GuessMethod {
  return loadPersisted<GuessMethod>('play-by-ear-guess-method', 'microphone') === 'manual'
    ? 'manual'
    : 'microphone';
}
