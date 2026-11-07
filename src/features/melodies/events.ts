import { bindClickActions } from '../../shared/dom';

import type { MelodyDifficulty } from './catalog';
import type { GuessMethod } from './round';

interface MelodyEventHandlers {
  beginManualGuessing: () => void;
  checkManualGuess: () => void;
  handleIntervalEntryClick: (event: MouseEvent) => void;
  navigateHistory: (offset: number) => void;
  newRound: () => void;
  playCurrentMelody: () => Promise<void>;
  revealAnswer: () => void;
  selectDifficulty: (difficulty: MelodyDifficulty) => void;
  selectMethod: (method: GuessMethod) => void;
  toggleGuessing: () => void;
  toggleRoot: () => void;
  updateManualInput: (field: HTMLInputElement) => void;
}

export function setupMelodyEvents(handlers: MelodyEventHandlers): void {
  bindClickActions({
    melodiesPlayBtn: () => void handlers.playCurrentMelody(),
    melodiesGuessBtn: handlers.toggleGuessing,
    melodiesRevealBtn: handlers.revealAnswer,
    melodiesNewBtn: handlers.newRound,
    melodiesPreviousBtn: handlers.navigateHistory.bind(null, -1),
    melodiesNextBtn: handlers.navigateHistory.bind(null, 1),
    melodiesRootToggle: handlers.toggleRoot,
    melodiesMicMethodBtn: handlers.selectMethod.bind(null, 'microphone'),
    melodiesManualMethodBtn: handlers.selectMethod.bind(null, 'manual'),
    melodiesEasyBtn: handlers.selectDifficulty.bind(null, 'easy'),
    melodiesMediumBtn: handlers.selectDifficulty.bind(null, 'medium'),
    melodiesHardBtn: handlers.selectDifficulty.bind(null, 'hard'),
    melodiesIntervalEntry: handlers.handleIntervalEntryClick,
    melodiesCheckBtn: handlers.checkManualGuess,
  });
  document.getElementById('melodiesIntervalInput')?.addEventListener('input', (event) => {
    handlers.updateManualInput(event.target as HTMLInputElement);
  });
  document.getElementById('melodiesKeyInput')?.addEventListener('input', (event) => {
    if ((event.target as HTMLInputElement).value.length > 0) handlers.beginManualGuessing();
  });
}
