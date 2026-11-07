import { bindClickActions } from '../../shared/dom';

import type { GuessMethod } from '../melodies/round';

interface PlayByEarEventHandlers {
  changePlaybackRate: (direction: -1 | 1) => Promise<void>;
  checkManualGuess: () => void;
  cycleAccidental: (index: number) => void;
  nextSection: () => void;
  playHeardNotes: () => Promise<void>;
  playOrRestartLoop: () => Promise<void>;
  playSimplifiedVersion: () => Promise<void>;
  previousSection: () => void;
  resetRecognizedNotes: () => void;
  revealAnswer: () => void;
  selectMethod: (method: GuessMethod) => void;
  selectSection: (index: number) => void;
  selectSongById: (id: string) => void;
  toggleListening: () => Promise<void>;
  updateManualInput: (field: HTMLInputElement) => void;
}

export function setupPlayByEarEvents(handlers: PlayByEarEventHandlers): void {
  bindClickActions({
    playEarLoopBtn: () => void handlers.playOrRestartLoop(),
    playEarSlowerBtn: () => void handlers.changePlaybackRate(-1),
    playEarFasterBtn: () => void handlers.changePlaybackRate(1),
    playEarSimplifiedBtn: () => void handlers.playSimplifiedVersion(),
    playEarGuessBtn: () => void handlers.toggleListening(),
    playEarResetNotesBtn: handlers.resetRecognizedNotes,
    playEarPlayHeardBtn: () => void handlers.playHeardNotes(),
    playEarCheckBtn: handlers.checkManualGuess,
    playEarRevealBtn: handlers.revealAnswer,
    playEarManualRevealBtn: handlers.revealAnswer,
    playEarMicMethodBtn: handlers.selectMethod.bind(null, 'microphone'),
    playEarManualMethodBtn: handlers.selectMethod.bind(null, 'manual'),
    playEarPreviousSectionBtn: handlers.previousSection,
    playEarNextSectionBtn: handlers.nextSection,
  });
  document.getElementById('playEarSongSelect')?.addEventListener('change', (event) => {
    handlers.selectSongById((event.target as HTMLSelectElement).value);
  });
  document.getElementById('playEarSectionTabs')?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-section-index]');
    if (button) handlers.selectSection(Number(button.dataset.sectionIndex));
  });
  document.getElementById('playEarIntervalEntry')?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-play-ear-accidental]'
    );
    if (button) handlers.cycleAccidental(Number(button.dataset.playEarAccidental));
    else document.getElementById('playEarIntervalInput')?.focus();
  });
  document.getElementById('playEarIntervalInput')?.addEventListener('input', (event) => {
    handlers.updateManualInput(event.target as HTMLInputElement);
  });
}
