import { describe, expect, it, vi } from 'vitest';

import { element } from '../../__fixtures__/browser';

import { renderScaleStrip, updateListenerDisplay } from './renderer';

describe('listener note presentation', () => {
  it('cancels an interrupted fade and allows the next silence to clear the new note', async () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div class="listener-display"><span id="listenerNoteName"></span><span id="listenerCents"></span><span id="listenerDegree"></span></div><div class="scale-strip"></div>';
    renderScaleStrip(document.body, 3, 'major', 'sharp');
    updateListenerDisplay(3, 'C', 0, 3, 'major');
    updateListenerDisplay(null, null, null, 3, 'major');
    await vi.advanceTimersByTimeAsync(100);
    updateListenerDisplay(7, 'E', 3, 3, 'major');
    await vi.advanceTimersByTimeAsync(300);
    expect(element('#listenerNoteName').textContent).toBe('E');
    expect(element('#listenerCents').textContent).toBe('+3¢');
    expect(element('#listenerDegree').textContent).toBe('3');
    expect(element('.listener-display').classList.contains('fading')).toBe(false);
    updateListenerDisplay(null, null, null, 3, 'major');
    await vi.advanceTimersByTimeAsync(100);
    updateListenerDisplay(null, null, null, 3, 'major');
    await vi.advanceTimersByTimeAsync(200);
    expect(element('#listenerNoteName').textContent).toBe('-');
    expect(element('#listenerCents').textContent).toBe('');
    expect(element('#listenerDegree').textContent).toBe('');
  });
  it.each(['major', 'minor', 'full'] as const)(
    'renders roles, tuning and fading for the %s strip',
    async (mode) => {
      expect.hasAssertions();
      vi.useFakeTimers();
      document.body.innerHTML =
        '<main id="fixture"><div class="listener-display"><span id="listenerNoteName"></span><span id="listenerCents"></span><span id="listenerDegree"></span></div><div class="scale-strip"></div></main>';
      const container = element('#fixture');
      renderScaleStrip(container, 11, mode, 'flat');
      for (const [note, name, cents] of [
        [11, 'Ab', 0],
        [0, 'A', 5],
        [2, 'B', -6],
        [3, 'C', null],
        [6, 'Eb', 20],
        [4, null, null],
      ] as const) {
        updateListenerDisplay(note, name, cents, 11, mode);
        expect(container.innerHTML).toMatchSnapshot(`note ${note}`);
      }
      updateListenerDisplay(null, null, null, 11, mode);
      expect(container.innerHTML).toMatchSnapshot('fading display');
      await vi.advanceTimersByTimeAsync(300);
      expect(container.innerHTML).toMatchSnapshot('cleared display');
      updateListenerDisplay(11, 'Ab', 0, 11, mode);
      expect(container.innerHTML).toMatchSnapshot('recovered display');
    }
  );
});
