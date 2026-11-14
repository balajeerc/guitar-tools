import { createMelodyPlayer } from '../melodies/playback';
import { type MelodyTone } from '../melodies/tone';

import { CHEATSHEET_INTERVALS, type CheatsheetInterval } from './cheatsheetCatalog';
import { cheatsheetHtml } from './cheatsheetView';

interface CheatsheetOptions {
  getTone: () => MelodyTone;
  onOpen: () => void;
}

function renderReference(row: HTMLElement, interval: CheatsheetInterval, index: number): void {
  const reference = interval.references[index];
  if (!reference) return;
  const title = row.querySelector('[data-song-title]');
  const cue = row.querySelector('[data-song-cue]');
  const count = row.querySelector('[data-song-count]');
  if (title) title.textContent = reference.title;
  if (cue) cue.textContent = reference.cue;
  if (count) count.textContent = `${index + 1} / ${interval.references.length}`;
}

function isBackdropClick(event: MouseEvent, dialog: HTMLDialogElement): boolean {
  if (event.target !== dialog) return false;
  const { left, right, top, bottom } = dialog.getBoundingClientRect();
  return (
    event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom
  );
}

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !(event.currentTarget instanceof HTMLDialogElement)) return;
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]');
  const first = controls[0];
  const last = controls[controls.length - 1];
  const boundary = event.shiftKey ? first : last;
  const destination = event.shiftKey ? last : first;
  if (boundary?.isSameNode(document.activeElement)) {
    event.preventDefault();
    destination?.focus();
  }
}

export function setupCheatsheet(options: CheatsheetOptions): void {
  const opener = document.getElementById('earTrainerCheatsheetBtn');
  if (!opener) return;
  const player = createMelodyPlayer();
  const references = new Map<number, number>();
  let dialog: HTMLDialogElement | null = null;
  let playbackId = 0;

  function stopPreview(): void {
    playbackId += 1;
    player.stop();
    for (const button of dialog?.querySelectorAll('[data-play-interval]') ?? []) {
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<span aria-hidden="true">▶</span>';
    }
  }

  async function playInterval(
    interval: CheatsheetInterval,
    button: HTMLButtonElement
  ): Promise<void> {
    const wasPlaying = button.getAttribute('aria-pressed') === 'true';
    stopPreview();
    const status = dialog?.querySelector('.cheatsheet-status');
    if (!status) return;
    if (wasPlaying) {
      status.textContent = 'Playback stopped.';
      return;
    }
    const currentPlayback = playbackId;
    button.setAttribute('aria-pressed', 'true');
    button.innerHTML = '<span aria-hidden="true">■</span>';
    status.textContent = `Playing ${interval.name}: C4, then ${interval.semitones} semitones above.`;
    try {
      await player.play(
        {
          id: 'interval-cheatsheet',
          title: interval.name,
          attribution: '',
          key: 'C',
          difficulty: 'easy',
          bpm: 80,
          degrees: [],
          notes: [60, 60 + interval.semitones].map((midi) => ({ midi, beats: 1 })),
        },
        options.getTone()
      );
      if (currentPlayback === playbackId)
        status.textContent = `${interval.name} finished. Hum it back, or try another interval.`;
    } catch {
      if (currentPlayback === playbackId)
        status.textContent = 'Audio couldn’t play. Try pressing play again.';
    } finally {
      if (currentPlayback === playbackId) stopPreview();
    }
  }

  function handleRowClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    const row = button?.closest<HTMLElement>('[data-interval]');
    if (!button || !row) return;
    const semitones = Number(row.dataset.interval);
    const interval = CHEATSHEET_INTERVALS.find((item) => item.semitones === semitones);
    if (!interval) return;
    if (button.hasAttribute('data-play-interval')) {
      void playInterval(interval, button);
      return;
    }
    const index =
      ((references.get(semitones) ?? 0) +
        Number(button.dataset.referenceStep) +
        interval.references.length) %
      interval.references.length;
    references.set(semitones, index);
    renderReference(row, interval, index);
  }

  function closeDialog(): void {
    dialog?.close();
  }

  function cleanup(): void {
    stopPreview();
    document.documentElement.classList.remove('cheatsheet-open');
    window.removeEventListener('hashchange', closeDialog);
    dialog?.remove();
    dialog = null;
    opener?.focus();
  }

  function openDialog(): void {
    if (dialog) return;
    options.onOpen();
    dialog = document.createElement('dialog');
    dialog.className = 'interval-cheatsheet';
    dialog.setAttribute('aria-labelledby', 'cheatsheetHeading');
    dialog.setAttribute('aria-describedby', 'cheatsheetDescription');
    dialog.innerHTML = cheatsheetHtml(CHEATSHEET_INTERVALS);
    for (const interval of CHEATSHEET_INTERVALS) {
      const row = dialog.querySelector<HTMLElement>(`[data-interval="${interval.semitones}"]`);
      if (row) renderReference(row, interval, references.get(interval.semitones) ?? 0);
    }
    dialog.addEventListener('keydown', trapFocus);
    dialog.addEventListener('click', handleRowClick);
    dialog.addEventListener('click', (event) => {
      if (dialog && isBackdropClick(event, dialog)) closeDialog();
    });
    dialog.querySelector('.cheatsheet-close')?.addEventListener('click', closeDialog);
    dialog.addEventListener('close', cleanup, { once: true });
    document.body.append(dialog);
    document.documentElement.classList.add('cheatsheet-open');
    window.addEventListener('hashchange', closeDialog);
    dialog.showModal();
  }

  opener.addEventListener('click', openDialog);
}
