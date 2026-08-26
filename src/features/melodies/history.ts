import type { Melody } from "./catalog";

export interface MelodyHistory {
  entries: Melody[];
  index: number;
}

export function createMelodyHistory(initialMelody: Melody): MelodyHistory {
  return { entries: [initialMelody], index: 0 };
}

export function appendMelody(history: MelodyHistory, melody: Melody): void {
  history.entries.splice(history.index + 1);
  history.entries.push(melody);
  history.index = history.entries.length - 1;
}

export function canMoveHistory(history: MelodyHistory, offset: number): boolean {
  const destination = history.index + offset;
  return destination >= 0 && destination < history.entries.length;
}

export function moveHistory(history: MelodyHistory, offset: number): Melody | null {
  if (!canMoveHistory(history, offset)) return null;
  history.index += offset;
  return history.entries[history.index] ?? null;
}
