import { describe, expect, it, vi } from 'vitest';

import { audioHarness, click, element, mountApp } from '../__fixtures__/browser';
import { detectPitch } from '../features/note-detection/pitchDetector';

import { requiredAt } from './requiredAt';

describe('fretboard plucked-string sound', () => {
  it('plays the selected octave at the expected pitch and releases every audio node', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    vi.resetModules();
    const audio = audioHarness();
    let seed = 123456789;
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      const values = array as Uint32Array;
      for (let i = 0; i < values.length; i++) {
        seed = (1664525 * seed + 1013904223) % 4294967296;
        values[i] = seed;
      }
      return array;
    });
    mountApp();
    const { initFretboardSound } = await import('./fretboardSound');
    initFretboardSound();
    const board = element('#fretboard');
    board.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 50 + 11.5 * (1350 / 22),
        clientY: 180,
      })
    );
    const buffer = requiredAt(audio.buffers, 0);
    expect(buffer).toHaveLength(19200);
    expect(detectPitch(buffer.getChannelData().slice(400, 2448), 8000)).toBeCloseTo(164.8138, 0);
    expect(audio.snapshot()).toMatchSnapshot('low E octave tone graph');
    expect(audio.context.resume).not.toHaveBeenCalled();
    audio.context.state = 'suspended';
    board.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1369, clientY: 20 }));
    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(
      audio
        .snapshot()
        .filter((node) => node.kind === 'filter')
        .slice(-3)[0]?.params.frequency
    ).toBe(3800);
    const marker = element('.fretboard-sound-tap');
    const remove = vi.spyOn(marker, 'remove');
    marker.dispatchEvent(new Event('animationend'));
    marker.dispatchEvent(new Event('animationend'));
    expect(remove).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(2500);
    for (const node of audio.nodes.filter((node) => node.kind !== 'destination'))
      expect(node.disconnect).toHaveBeenCalledOnce();
  });

  it('restores muted preferences and synchronizes both sound toggles', async () => {
    expect.hasAssertions();
    vi.resetModules();
    mountApp();
    localStorage.setItem('fretboard-sound-enabled', 'false');
    const { initFretboardSound } = await import('./fretboardSound');
    initFretboardSound();
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.sound-toggle')];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.classList.contains('sound-off')).toBe(true);
      expect(button.getAttribute('aria-label')).toBe('Fretboard sound off');
      expect(button.title).toBe('Fretboard sound: off');
    }
    click('.sound-toggle');
    for (const button of buttons) {
      expect(button.classList.contains('sound-off')).toBe(false);
      expect(button.getAttribute('aria-label')).toBe('Fretboard sound on');
      expect(button.title).toBe('Fretboard sound: on');
    }
    expect(localStorage.getItem('fretboard-sound-enabled')).toBe('true');
  });
});
