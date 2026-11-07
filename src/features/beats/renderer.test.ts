import { describe, expect, it } from 'vitest';

import { element } from '../../__fixtures__/browser';

import { createDefaultPattern } from './pattern';
import { beatGridHtml, beatMixerHtml, highlightGridStep, updateBeatCell } from './renderer';

describe('drum pattern presentation', () => {
  it('labels every subdivision and aligns the four voices with the beat grid', () => {
    document.body.innerHTML = beatGridHtml(createDefaultPattern());
    const grid = element('.beats-grid');
    expect(grid.outerHTML).toMatchSnapshot();
    expect(grid.querySelectorAll('.beats-cell')).toHaveLength(64);
    expect(
      element('.beats-cell[data-voice="snare"][data-step="4"]').getAttribute('aria-label')
    ).toBe('Snare, beat 2 2');
    highlightGridStep(grid, 5);
    expect(
      [...grid.querySelectorAll('.current')].map((cell) => cell.getAttribute('data-step'))
    ).toEqual(['5', '5', '5', '5', '5']);
    highlightGridStep(grid, null);
    expect(grid.querySelector('.current')).toBeNull();
  });

  it('updates only the requested hit and tolerates an absent cell', () => {
    document.body.innerHTML = beatGridHtml(createDefaultPattern());
    const grid = element('.beats-grid');
    const cell = element('.beats-cell[data-voice="kick"][data-step="1"]');
    updateBeatCell(grid, 'kick', 1, true);
    expect(cell.classList.contains('active')).toBe(true);
    expect(cell.getAttribute('aria-pressed')).toBe('true');
    updateBeatCell(grid, 'kick', 1, false);
    expect(cell.classList.contains('active')).toBe(false);
    expect(cell.getAttribute('aria-pressed')).toBe('false');
    cell.remove();
    expect(() => {
      updateBeatCell(grid, 'kick', 1, true);
    }).not.toThrow();
  });

  it('exposes accessible volume controls with the saved track levels', () => {
    document.body.innerHTML = beatMixerHtml({ kick: 0.1, snare: 0.2, hihat: 0.3, crash: 0.4 });
    expect(element('.beats-mixer').outerHTML).toMatchSnapshot();
  });
});
