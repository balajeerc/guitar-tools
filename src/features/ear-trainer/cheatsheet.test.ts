import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  audioHarness,
  click,
  element,
  mockRandomValues,
  mountApp,
  settle,
} from '../../__fixtures__/browser';

import { loadEarTrainerSettings, saveEarTrainerSettings } from './settings';
import { DEFAULT_EAR_TRAINER_SETTINGS } from './theory';

function row(semitones: number): string {
  return `[data-interval="${semitones}"]`;
}

function play(semitones: number): void {
  click(`${row(semitones)} [data-play-interval]`);
}

function frequencies(audio: ReturnType<typeof audioHarness>): unknown[] {
  return audio.events
    .filter(
      (event) => event.method === 'frequency.set' && audio.nodes[event.node]?.kind === 'oscillator'
    )
    .map((event) => event.args[0]);
}

function mockDialog(): void {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement): void {
        this.open = true;
        this.querySelector<HTMLElement>('[autofocus]')?.focus();
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement): void {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    },
  });
}

describe('ear trainer interval cheatsheet', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    mockDialog();
    mockRandomValues();
    mountApp();
    saveEarTrainerSettings({ ...DEFAULT_EAR_TRAINER_SETTINGS, tone: 'bright' });
    const { initEarTrainerFeature } = await import('./index');
    initEarTrainerFeature();
  });

  it('opens an accessible modal and independently cycles five songs in every row in both directions', () => {
    expect.hasAssertions();
    click('#earTrainerCheatsheetBtn');
    expect(element('dialog').getAttribute('aria-labelledby')).toBe('cheatsheetHeading');
    expect(element('dialog').getAttribute('aria-describedby')).toBe('cheatsheetDescription');
    expect(document.activeElement).toBe(element('.cheatsheet-close'));
    expect(document.querySelectorAll('.cheatsheet-table tbody tr')).toHaveLength(12);
    expect(document.documentElement.classList.contains('cheatsheet-open')).toBe(true);
    for (let semitones = 1; semitones <= 12; semitones++) {
      const selector = row(semitones);
      const first = element(`${selector} [data-song-title]`).textContent;
      expect(first.trim()).not.toBe('');
      expect(element(`${selector} [data-song-cue]`).textContent.trim()).not.toBe('');
      const titles = new Set([first]);
      for (let index = 1; index < 5; index++) {
        click(`${selector} [data-reference-step="1"]`);
        const title = element(`${selector} [data-song-title]`).textContent;
        expect(title.trim()).not.toBe('');
        titles.add(title);
        expect(element(`${selector} [data-song-count]`).textContent).toBe(`${index + 1} / 5`);
        expect(element(`${selector} [data-song-cue]`).textContent.length).toBeGreaterThan(0);
      }
      expect(titles.size).toBe(5);
      click(`${selector} [data-reference-step="1"]`);
      expect(element(`${selector} [data-song-title]`).textContent).toBe(first);
      click(`${selector} [data-reference-step="-1"]`);
      expect(element(`${selector} [data-song-count]`).textContent).toBe('5 / 5');
    }
    click('.cheatsheet-close');
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.documentElement.classList.contains('cheatsheet-open')).toBe(false);
    expect(document.activeElement?.id).toBe('earTrainerCheatsheetBtn');
    click('#earTrainerCheatsheetBtn');
    expect(element(`${row(1)} [data-song-count]`).textContent).toBe('5 / 5');
    expect(element(`${row(12)} [data-song-count]`).textContent).toBe('5 / 5');
    click('.cheatsheet-close');
  });

  it.each([
    [1, 277.1826, 'Minor 2nd', 'm2', '♭2'],
    [2, 293.6648, 'Major 2nd', 'M2', '2'],
    [3, 311.127, 'Minor 3rd', 'm3', '♭3'],
    [4, 329.6276, 'Major 3rd', 'M3', '3'],
    [5, 349.2282, 'Perfect 4th', 'P4', '4'],
    [6, 369.9944, 'Tritone', 'A4 / d5', '♯4 / ♭5'],
    [7, 391.9954, 'Perfect 5th', 'P5', '5'],
    [8, 415.3047, 'Minor 6th', 'm6', '♭6'],
    [9, 440, 'Major 6th', 'M6', '6'],
    [10, 466.1638, 'Minor 7th', 'm7', '♭7'],
    [11, 493.8833, 'Major 7th', 'M7', '7'],
    [12, 523.2511, 'Octave', 'P8', '1′'],
  ] as const)(
    'plays C4 followed by the note %i semitones above, in the selected tone',
    async (semitones, expected, name, symbol, degree) => {
      const audio = audioHarness();
      const preferences = loadEarTrainerSettings();
      click('#earTrainerCheatsheetBtn');
      expect(element(`${row(semitones)} th`).textContent).toContain(name);
      expect(element(`${row(semitones)} th small`).textContent).toBe(`${symbol} · 1 → ${degree}`);
      expect(element(`${row(semitones)} [data-play-interval]`).getAttribute('aria-label')).toBe(
        `Play ${name}: root then ${degree}`
      );
      play(semitones);
      await settle();
      const heard = frequencies(audio);
      expect(heard).toHaveLength(2);
      expect(element(`${row(semitones)} [data-play-interval]`).textContent).toBe('■');
      expect(heard[0]).toBeCloseTo(261.6256, 3);
      expect(heard[1]).toBeCloseTo(expected, 3);
      expect(
        audio.nodes.filter((node) => node.kind === 'oscillator').map((node) => node.type)
      ).toEqual(['sawtooth', 'sawtooth']);
      expect(element(`${row(semitones)} [data-play-interval]`).getAttribute('aria-pressed')).toBe(
        'true'
      );
      await vi.advanceTimersByTimeAsync(2000);
      expect(element(`${row(semitones)} [data-play-interval]`).getAttribute('aria-pressed')).toBe(
        'false'
      );
      expect(element('.cheatsheet-status').textContent).toContain('finished');
      expect(element(`${row(semitones)} [data-play-interval]`).textContent).toBe('▶');
      expect(loadEarTrainerSettings()).toEqual(preferences);
      expect(element('#earTrainerStatus').textContent).toBe('Press play to listen');
      click('.cheatsheet-close');
    }
  );

  it('cancels earlier intervals without allowing stale completion to overwrite the active playback', async () => {
    const audio = audioHarness();
    click('#earTrainerCheatsheetBtn');
    play(1);
    await vi.advanceTimersByTimeAsync(1000);
    play(12);
    await vi.advanceTimersByTimeAsync(600);
    expect(element(`${row(12)} [data-play-interval]`).getAttribute('aria-pressed')).toBe('true');
    expect(element('.cheatsheet-status').textContent).toContain('Playing Octave');
    const stopped = audio.events.filter(
      (event) => event.method === 'stop' && event.args.length === 0
    ).length;
    play(12);
    expect(
      audio.events.filter((event) => event.method === 'stop' && event.args.length === 0)
    ).toHaveLength(stopped + 2);
    expect(element('.cheatsheet-status').textContent).toBe('Playback stopped.');
    await vi.advanceTimersByTimeAsync(2000);
    expect(element('.cheatsheet-status').textContent).toBe('Playback stopped.');
    click('.cheatsheet-close');
  });

  it('stops an active exercise on open and cancels previews on close and navigation', async () => {
    const audio = audioHarness();
    click('#earTrainerPlayBtn');
    await settle();
    click('#earTrainerCheatsheetBtn');
    expect(element('#earTrainerStatus').textContent).toBe('Playback stopped');
    play(7);
    await settle();
    click('.cheatsheet-close');
    const stopped = audio.events.filter(
      (event) => event.method === 'stop' && event.args.length === 0
    ).length;
    expect(stopped).toBe(5);
    click('#earTrainerCheatsheetBtn');
    play(8);
    await settle();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.documentElement.classList.contains('cheatsheet-open')).toBe(false);
    expect(
      audio.events.filter((event) => event.method === 'stop' && event.args.length === 0)
    ).toHaveLength(stopped + 2);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(element('#earTrainerStatus').textContent).toBe('Playback stopped');
  });

  it.each([
    { clientX: 99, clientY: 200 },
    { clientX: 301, clientY: 200 },
    { clientX: 200, clientY: 99 },
    { clientX: 200, clientY: 301 },
  ])('closes when the backdrop is clicked at $clientX, $clientY', (position) => {
    click('#earTrainerCheatsheetBtn');
    const dialog = element('dialog');
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200));
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, ...position }));
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement?.id).toBe('earTrainerCheatsheetBtn');
  });

  it('keeps clicks within the dialog and on its boundaries open', () => {
    expect.hasAssertions();
    click('#earTrainerCheatsheetBtn');
    const dialog = element('dialog');
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200));
    for (const position of [
      { clientX: 200, clientY: 200 },
      { clientX: 100, clientY: 200 },
      { clientX: 300, clientY: 200 },
      { clientX: 200, clientY: 100 },
      { clientX: 200, clientY: 300 },
    ]) {
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, ...position }));
      expect(document.querySelector('dialog')).toBe(dialog);
    }
    element('#cheatsheetHeading').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('dialog')).toBe(dialog);
    click('.cheatsheet-close');
  });

  it('keeps keyboard navigation within the modal', () => {
    click('#earTrainerCheatsheetBtn');
    const dialog = element('dialog');
    const close = element('.cheatsheet-close');
    const last = element('.cheatsheet-source a');
    const backwards = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    close.dispatchEvent(backwards);
    expect(backwards.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(close);
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(close);
    const middle = element(`${row(1)} [data-reference-step="1"]`);
    middle.focus();
    const forwards = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    middle.dispatchEvent(forwards);
    expect(forwards.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(middle);
    click('.cheatsheet-close');
  });

  it('recovers from an audio failure and allows retrying', async () => {
    const audio = audioHarness();
    audio.context.createOscillator.mockImplementationOnce(() => {
      throw new Error('audio failed');
    });
    click('#earTrainerCheatsheetBtn');
    play(1);
    await settle();
    expect(element('.cheatsheet-status').textContent).toContain('Audio couldn’t play');
    expect(element(`${row(1)} [data-play-interval]`).getAttribute('aria-pressed')).toBe('false');
    play(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(element('.cheatsheet-status').textContent).toContain('finished');
    click('.cheatsheet-close');
  });
});
