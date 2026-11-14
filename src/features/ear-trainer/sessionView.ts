import { setHidden, setText } from '../melodies/ui';

import { type EarTrainerPractice, refreshSession } from './practice';

export function renderSession(practice: EarTrainerPractice, enabled: boolean): void {
  refreshSession(practice);
  setHidden('earTrainerSession', !enabled);
  const { correct, total, rounds } = practice.today;
  const accuracy = total === 0 ? '—' : `${Math.round((correct / total) * 100)}%`;
  setText('earTrainerAccuracy', `${accuracy} first-try accuracy`);
  setText(
    'earTrainerSessionCount',
    `${correct} of ${total} notes · ${rounds} ${rounds === 1 ? 'exercise' : 'exercises'}`
  );
  setText(
    'earTrainerSessionHint',
    total === 0
      ? 'Check your first answer to start today’s session.'
      : 'Only your first check counts. Revealed notes count as missed; prefilled roots are excluded.'
  );
}
