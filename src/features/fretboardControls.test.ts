import { describe, expect, it, vi } from 'vitest';

import { click, element, mountApp } from '../__fixtures__/browser';

import { initCircleOfFifthsFeature } from './circle-of-fifths';
import { initFretWalkFeature } from './fret-walk';
import { renderFretWalk } from './fret-walk/renderer';
import { initFretboardDiscoveryFeature } from './fretboard-discovery';
import { renderFretboard as renderDiscovery } from './fretboard-discovery/renderer';
import { initScalesFeature } from './scales';
import { renderCAGEDHeader, renderFretboard } from './scales/renderer';
import { initTriadsFeature } from './triads';
import { renderTriads } from './triads/renderer';

// State/control tests observe the rendering boundary; geometry is covered
// independently by the complete fretboard rendering snapshots.
vi.mock('./scales/renderer', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, renderCAGEDHeader: vi.fn(), renderFretboard: vi.fn() };
});
vi.mock('./triads/renderer', () => ({ renderTriads: vi.fn() }));
vi.mock('./fret-walk/renderer', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, renderFretWalk: vi.fn() };
});
vi.mock('./fretboard-discovery/renderer', () => ({ renderFretboard: vi.fn() }));

function saved(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? 'null');
}

describe('fretboard controls', () => {
  it('restores the selected triad key, orbit and custom progression', () => {
    vi.useFakeTimers();
    mountApp();
    const state = {
      rootIndex: 5,
      scaleType: 'minor',
      showOrbit: true,
      viewMode: 'groupings',
      progression: [
        { degree: 2, quality: 'diminished' },
        { degree: 4, quality: 'minor' },
        { degree: 5, quality: 'major' },
        { degree: 1, quality: 'minor' },
      ],
    };
    localStorage.setItem('triads-state', JSON.stringify(state));
    initTriadsFeature();
    expect(saved('triads-state')).toEqual(state);
    expect(element('#triads-page').innerHTML).toMatchSnapshot('restored custom triad progression');
    expect(vi.mocked(renderTriads).mock.lastCall?.slice(0, 3)).toEqual([5, 'minor', true]);
    click('#triadsControlsPanel .reset-link');
  });
  it('restores a valid minor circle key and selected degrees', () => {
    mountApp();
    const state = { index: 3, mode: 'minor', degrees: [1, 5, 6] };
    localStorage.setItem('circle-of-fifths-state', JSON.stringify(state));
    initCircleOfFifthsFeature();
    expect(saved('circle-of-fifths-state')).toEqual(state);
    expect(element('#cofPanel').innerHTML).toMatchSnapshot('restored minor circle progression');
    expect(element('#cofWheel').innerHTML).toMatchSnapshot('restored minor circle selection');
    click('#cofPanel .reset-link');
  });

  it('restores and reflects scale display and highlighting choices', () => {
    expect.hasAssertions();
    mountApp();
    localStorage.setItem(
      'scales-state',
      JSON.stringify({
        rootIndex: 5,
        scale: 'minor',
        displayMode: 'notes',
        highlightMode: 'caged',
      })
    );
    initScalesFeature();
    expect(element('#scales-page').innerHTML).toMatchSnapshot('restored scales');
    for (const id of [
      'majorBtn',
      'minorBtn',
      'intervalsBtn',
      'notesBtn',
      'pentatonicHighlightBtn',
      'fullHighlightBtn',
      'cagedHighlightBtn',
    ]) {
      click(`#${id}`);
      expect(element(`#${id}`).classList.contains('active')).toBe(true);
      expect(element('#scales-page').innerHTML).toMatchSnapshot(id);
    }
    click('#controlsPanel .reset-link');
  });

  it('reflects triad view, orbit and scale controls independently', () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    mountApp();
    initTriadsFeature();
    expect(element('#triads-page').innerHTML).toMatchSnapshot('initial triad controls');
    for (const id of [
      'triadsMinorBtn',
      'triadsMajorBtn',
      'triadsOrbitOnBtn',
      'triadsOrbitOffBtn',
      'triadsGroupingsViewBtn',
      'triadsStaticViewBtn',
    ]) {
      click(`#${id}`);
      expect(element(`#${id}`).getAttribute('aria-pressed')).toBe('true');
      expect(element('#triads-page').innerHTML).toMatchSnapshot(id);
    }
  });

  it('reflects every walk mode and label selection immediately', () => {
    expect.hasAssertions();
    mountApp();
    localStorage.setItem(
      'fret-walk-state',
      JSON.stringify({
        anchors: [{ stringIdx: 0, fret: 0 }],
        displayMode: 'notes',
        mode: 'minor',
      })
    );
    initFretWalkFeature();
    expect(element('#fret-walk-page').innerHTML).toMatchSnapshot('restored walk controls');
    for (const [id, property, value] of [
      ['fretWalkMajorBtn', 'mode', 'major'],
      ['fretWalkFullBtn', 'mode', 'full'],
      ['fretWalkMinorBtn', 'mode', 'minor'],
      ['fretWalkIntervalsBtn', 'displayMode', 'intervals'],
      ['fretWalkNotesBtn', 'displayMode', 'notes'],
    ]) {
      click(`#${id}`);
      expect(saved('fret-walk-state')).toHaveProperty(property ?? '', value);
      expect(element(`#${id}`).classList.contains('active')).toBe(true);
      expect(element('#fret-walk-page').innerHTML).toMatchSnapshot(id);
    }
  });

  it('restores discovery selections and keeps checkboxes and grouping controls in sync', () => {
    mountApp();
    localStorage.setItem('fretboard-discovery-notes', JSON.stringify(['C', 'E', 'G']));
    localStorage.setItem('fretboard-discovery-strings', JSON.stringify([1, 2]));
    localStorage.setItem('fretboard-discovery-grouping', 'true');
    initFretboardDiscoveryFeature();
    expect(element('#discovery-controls').innerHTML).toMatchSnapshot('restored discovery controls');
    const toggle = element('#discovery-controls .control-group:nth-child(2) .select-all-btn');
    toggle.click();
    expect(element('#discoveryControlsSummary').textContent).toBe(
      '3 notes · All strings · Grouped'
    );
    expect(toggle.textContent).toBe('Deselect All');
    toggle.click();
    expect(element('#discoveryControlsSummary').textContent).toBe('3 notes · 0 strings · Grouped');
    expect(toggle.textContent).toBe('Select All');
    expect(
      document.querySelectorAll('#discovery-controls .control-group:nth-child(2) input:checked')
    ).toHaveLength(0);
    click('#discovery-controls .toggle-group button:first-child');
    expect(element('#discovery-controls .group-legend').style.display).toBe('none');
    click('#discovery-controls .reset-link');
    expect(element('#discovery-controls').innerHTML).toMatchSnapshot('reset discovery controls');
    click('#discovery-controls .select-all-btn');
    expect(element('#discoveryControlsSummary').textContent).toBe('0 notes · All strings');
    click('#discovery-controls .reset-link');
  });

  it('changes scale root, type, labels and highlights, persists state and resets', () => {
    expect.hasAssertions();
    mountApp();
    initScalesFeature();
    expect(element('#controlsSummary').textContent).toBe('C Major · Intervals · Full');
    click('#prevNote');
    expect(element('#currentNote').textContent).toBe('B');
    click('#nextNote');
    click('#minorBtn');
    click('#notesBtn');
    click('#cagedHighlightBtn');
    expect(saved('scales-state')).toEqual({
      rootIndex: 3,
      scale: 'minor',
      displayMode: 'notes',
      highlightMode: 'caged',
    });
    expect(element('#cagedLegend').style.display).toBe('flex');
    expect(renderFretboard).toHaveBeenLastCalledWith(3, 'minor', 'notes', 'caged');
    expect(renderCAGEDHeader).toHaveBeenLastCalledWith(3, 'caged', 'minor');
    click('#pentatonicHighlightBtn');
    click('#fullHighlightBtn');
    click('#majorBtn');
    click('#intervalsBtn');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(element('#currentNote').textContent).toBe('B');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(element('#currentNote').textContent).toBe('C');
    click('#controlsPanel .reset-link');
    expect(saved('scales-state')).toEqual({
      rootIndex: 3,
      scale: 'major',
      displayMode: 'intervals',
      highlightMode: 'full',
    });
    element('#scales-page').style.display = 'none';
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(element('#currentNote').textContent).toBe('C');
  });
  it('walks upward by octaves, truncates at an anchor and clears on outside click', () => {
    mountApp();
    element('#fret-walk-page').style.display = '';
    initFretWalkFeature();
    const board = element('#fret-walk-fretboard');
    board.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 25, clientY: 180 }));
    expect(saved('fret-walk-state')).toMatchObject({ anchors: [{ stringIdx: 0, fret: 0 }] });
    const configWidth = (1400 - 50) / 22;
    board.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 50 + 11.5 * configWidth, clientY: 180 })
    );
    expect(element('#fretWalkControlsSummary').textContent).toContain('(+1 oct)');
    click('#fretWalkMinorBtn');
    click('#fretWalkNotesBtn');
    expect(saved('fret-walk-state')).toMatchObject({ mode: 'minor', displayMode: 'notes' });
    click('#fretWalkFullBtn');
    click('#fretWalkIntervalsBtn');
    click('#fretWalkMajorBtn');
    board.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 50 + 11.5 * configWidth, clientY: 180 })
    );
    expect(element('#fretWalkControlsSummary').textContent).not.toContain('(+1 oct)');
    board.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 25, clientY: 180 }));
    expect(element('#fretWalkControlsSummary').textContent).toBe('Click a note to walk from');
    board.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 25, clientY: 20 }));
    element('#fretWalkInfo').click();
    expect(saved('fret-walk-state')).toMatchObject({ anchors: [] });
    click('#fretWalk-controls .reset-link');
    expect(renderFretWalk).toHaveBeenCalled();
    expect(saved('fret-walk-state')).toEqual({
      anchors: [],
      displayMode: 'intervals',
      mode: 'major',
    });
  });
  it('selects notes and strings, connects groups and restores defaults', () => {
    mountApp();
    initFretboardDiscoveryFeature();
    click('#discovery-controls .select-all-btn');
    expect(element('#discoveryControlsSummary').textContent).toBe('0 notes · All strings');
    click('#discovery-controls .select-all-btn');
    click('#discovery-controls input[value="A"]');
    expect(element('#discoveryControlsSummary').textContent).toBe('11 notes · All strings');
    click('#discovery-controls input[value="A"]');
    click('#discovery-controls input[value="6"]');
    expect(element('#discoveryControlsSummary').textContent).toBe('All notes · 5 strings');
    click('#discovery-controls input[value="6"]');
    click('#discovery-controls .toggle-group button:last-child');
    expect(element('#discoveryControlsSummary').textContent).toBe(
      'All notes · All strings · Grouped'
    );
    expect(renderDiscovery).toHaveBeenLastCalledWith(
      expect.any(Set),
      new Set([1, 2, 3, 4, 5, 6]),
      true
    );
    click('#discovery-controls .toggle-group button:first-child');
    click('#discovery-controls .reset-link');
    expect(element('#discoveryControlsSummary').textContent).toBe('All notes · All strings');
    expect(saved('fretboard-discovery-grouping')).toBe(false);
  });
  it('edits a triad progression, pauses a selected step and resumes after inactivity', () => {
    vi.useFakeTimers();
    mountApp();
    element('#triads-page').style.display = '';
    initTriadsFeature();
    click('#triadsPrevNote');
    expect(element('#triadsCurrentNote').textContent).toBe('B');
    click('#triadsNextNote');
    click('#triadsMinorBtn');
    click('#triadsOrbitOnBtn');
    expect(element('#triadsControlsSummary').textContent).toBe('C Minor · Orbit');
    click('#triadsGroupingsViewBtn');
    expect(element('#triadsControlsSummary').textContent).toContain('Groupings');
    vi.advanceTimersByTime(2000);
    expect(element('[data-triad-step="1"]').getAttribute('aria-current')).toBe('step');
    click('[data-triad-step="2"]');
    expect(element('#triadsStepStatus').classList.contains('is-paused')).toBe(true);
    vi.advanceTimersByTime(59_999);
    expect(element('[data-triad-step="2"]').getAttribute('aria-current')).toBe('step');
    vi.advanceTimersByTime(2001);
    expect(element('[data-triad-step="3"]').getAttribute('aria-current')).toBe('step');
    click('[data-progression-degree="0"]');
    click('[data-progression-quality="0"]');
    expect(element('[data-progression-degree="0"]').textContent).toBe('ii');
    click('[data-progression-quality="0"]');
    click('#triadsMajorBtn');
    click('#triadsOrbitOffBtn');
    click('#triadsStaticViewBtn');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(element('#triadsCurrentNote').textContent).toBe('C');
    click('#triadsControlsPanel .reset-link');
    expect(element('#triadsControlsSummary').textContent).toBe('C Major');
    expect(vi.mocked(renderTriads).mock.lastCall).toEqual([3, 'major', false, undefined]);
    vi.advanceTimersByTime(2000);
    expect(element('[data-triad-step="0"]').getAttribute('aria-current')).toBe('step');
  });
  it('selects circle keys and degrees and rejects corrupt persisted indices', () => {
    mountApp();
    localStorage.setItem(
      'circle-of-fifths-state',
      JSON.stringify({ index: 12, mode: 'bad', degrees: [-1, 0, 7, 1.5] })
    );
    initCircleOfFifthsFeature();
    expect(saved('circle-of-fifths-state')).toEqual({ index: 0, mode: 'major', degrees: [0] });
    element('.cof-sector[data-index="1"][data-mode="minor"]').dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
    expect(saved('circle-of-fifths-state')).toEqual({ index: 1, mode: 'minor', degrees: [0] });
    click('.cof-degree-btn[data-degree="3"]');
    expect(saved('circle-of-fifths-state')).toMatchObject({ degrees: [0, 3] });
    click('.cof-degree-btn[data-degree="0"]');
    expect(saved('circle-of-fifths-state')).toMatchObject({ degrees: [3] });
    click('#cofPanel .reset-link');
    expect(saved('circle-of-fifths-state')).toEqual({
      index: 0,
      mode: 'major',
      degrees: [0, 3, 4],
    });
    expect(element('#cofPanel').innerHTML).toMatchSnapshot();
    expect(element('#cofWheel').innerHTML).toMatchSnapshot();
  });
});
