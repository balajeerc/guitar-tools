import { describe, expect, it, vi } from 'vitest';

import { click, element } from '../../__fixtures__/browser';

import { loadMelodyTone, setupToneControl, toneControlHtml } from './toneControl';

describe('melody tone controls', () => {
  it('restores a valid saved tone and rejects malformed preferences', () => {
    expect(loadMelodyTone()).toBe('pluck');
    localStorage.setItem('melodies-tone', JSON.stringify('warm'));
    expect(loadMelodyTone()).toBe('warm');
    localStorage.setItem('melodies-tone', JSON.stringify('unknown'));
    expect(loadMelodyTone()).toBe('pluck');
  });

  it('shows the selected tone, persists every choice and notifies playback', () => {
    expect.hasAssertions();
    document.body.innerHTML = toneControlHtml();
    expect(element('.melodies-tone').outerHTML).toMatchSnapshot();
    const onChange = vi.fn();
    setupToneControl('bright', onChange);
    expect(element('[aria-pressed="true"]').id).toBe('melodiesTonebrightBtn');
    expect(onChange).not.toHaveBeenCalled();
    for (const tone of ['warm', 'pure', 'bright', 'pluck']) {
      click(`#melodiesTone${tone}Btn`);
      expect(document.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
      expect(element('[aria-pressed="true"]').id).toBe(`melodiesTone${tone}Btn`);
      expect(loadMelodyTone()).toBe(tone);
      expect(onChange).toHaveBeenLastCalledWith(tone);
    }
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('initializes safely when tone buttons are absent', () => {
    const onChange = vi.fn();
    expect(() => {
      setupToneControl('pure', onChange);
    }).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });
});
