export interface MelodyNote {
  beats: number;
  midi: number;
  restAfterBeats?: number;
}

export type MelodyDifficulty = 'easy' | 'hard' | 'medium';

export interface Melody {
  attribution: string;
  bpm: number;
  degrees: readonly string[];
  difficulty: MelodyDifficulty;
  id: string;
  key: string;
  notes: readonly MelodyNote[];
  title: string;
}
