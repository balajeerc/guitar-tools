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
      const titles = new Set([first]);
      for (let index = 1; index < 5; index++) {
        click(`${selector} [data-reference-step="1"]`);
        titles.add(element(`${selector} [data-song-title]`).textContent);
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
    [1, 277.1826],
    [2, 293.6648],
    [3, 311.127],
    [4, 329.6276],
    [5, 349.2282],
    [6, 369.9944],
    [7, 391.9954],
    [8, 415.3047],
    [9, 440],
    [10, 466.1638],
    [11, 493.8833],
    [12, 523.2511],
  ])(
    'plays C4 followed by the note %i semitones above, in the selected tone',
    async (semitones, expected) => {
      const audio = audioHarness();
      const preferences = loadEarTrainerSettings();
      click('#earTrainerCheatsheetBtn');
      play(semitones);
      await settle();
      const heard = frequencies(audio);
      expect(heard).toHaveLength(2);
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

  it('closes on a backdrop click and leaves clicks inside the dialog open', () => {
    click('#earTrainerCheatsheetBtn');
    element('dialog').dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 })
    );
    expect(document.querySelector('dialog')).not.toBeNull();
    element('dialog').dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 })
    );
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement?.id).toBe('earTrainerCheatsheetBtn');
  });

  it('keeps keyboard navigation within the modal', () => {
    click('#earTrainerCheatsheetBtn');
    const dialog = element('dialog');
    const close = element('.cheatsheet-close');
    const last = element('.cheatsheet-source a');
    close.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    );
    expect(document.activeElement).toBe(last);
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(close);
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(close);
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
