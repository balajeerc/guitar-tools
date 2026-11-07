import { requiredAt } from '../../shared/requiredAt';

import { EASY_MELODIES } from './easyCatalog';
import { HARD_MELODIES } from './hardCatalog';
import { MEDIUM_MELODIES } from './mediumCatalog';

import type { Melody, MelodyDifficulty } from './catalogTypes';
export type { Melody, MelodyDifficulty } from './catalogTypes';

const MELODIES: readonly Melody[] = [...EASY_MELODIES, ...MEDIUM_MELODIES, ...HARD_MELODIES];

export function pickMelody(difficulty: MelodyDifficulty, previousId?: string): Melody {
  const choices = MELODIES.filter(
    (melody) => melody.difficulty === difficulty && melody.id !== previousId
  );
  const random = requiredAt(crypto.getRandomValues(new Uint32Array(1)), 0);
  return (
    choices[random % choices.length] ??
    MELODIES.find((melody) => melody.difficulty === difficulty) ??
    requiredAt(MELODIES, 0)
  );
}
