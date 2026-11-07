import { describe, expect, it } from 'vitest';

import { element, mountApp } from '../__fixtures__/browser';
import { initFretWalkFeature } from '../features/fret-walk';
import { anchorPitch, describeAnchor, renderFretWalk } from '../features/fret-walk/renderer';
import { initFretboardDiscoveryFeature } from '../features/fretboard-discovery';
import { renderFretboard as renderDiscovery } from '../features/fretboard-discovery/renderer';
import { initScalesFeature } from '../features/scales';
import { renderCAGEDHeader, renderFretboard } from '../features/scales/renderer';
import { initTriadsFeature } from '../features/triads';
import { renderTriads } from '../features/triads/renderer';

import { NOTES } from './constants';
import { positionFromPoint } from './fretboardPosition';
import { fretCenterPosition } from './fretboardRenderer';
import { getLayoutConfig } from './layout';

const layouts = [false, true];
const scales = ['major', 'minor'] as const;
const modes = ['caged', 'pentatonic', 'full'] as const;
const examples = layouts.flatMap((vertical) =>
  scales.flatMap((scale) => modes.map((mode) => ({ vertical, scale, mode })))
);

describe('scale fretboard rendering', () => {
  it.each(examples)('renders $scale $mode with vertical=$vertical', ({ vertical, scale, mode }) => {
    expect.hasAssertions();
    mountApp();
    const query = window.matchMedia('(max-width: 767px)');
    Object.defineProperty(query, 'matches', { value: vertical });
    initScalesFeature();
    renderCAGEDHeader(3, mode, scale);
    renderFretboard(3, scale, 'intervals', mode);
    expect({
      header: element('#cagedHeader').outerHTML,
      board: element('#fretboard').innerHTML,
      numbers: element('#fretNumbers').innerHTML,
    }).toMatchSnapshot();
    const labels = document.querySelectorAll<HTMLElement>('#cagedHeader .shape-label');
    for (const label of [...labels].filter((_, index) =>
      [0, 1, labels.length - 1].includes(index)
    )) {
      label.dispatchEvent(new Event('mouseenter'));
      expect(element('#fretboard').innerHTML).toMatchSnapshot('hovered shape');
      label.dispatchEvent(new Event('mouseleave'));
    }
    renderFretboard(11, scale, 'notes', mode);
    expect(element('#fretboard').innerHTML).toMatchSnapshot();
    expect(element('#fretboard').querySelectorAll('.string-line')).toHaveLength(6);
    expect(element('#fretboard').querySelectorAll('.fret-line')).toHaveLength(23);
  });
});

describe('fret walks, triads and discovery rendering', () => {
  it.each(layouts)('renders physical string geometry with vertical=%s', (vertical) => {
    expect.hasAssertions();
    mountApp();
    Object.defineProperty(window.matchMedia('(max-width: 767px)'), 'matches', { value: vertical });
    initFretWalkFeature();
    initFretboardDiscoveryFeature();
    initTriadsFeature();
    expect(anchorPitch({ stringIdx: 0, fret: 0 })).toBe(0);
    expect(describeAnchor({ stringIdx: 0, fret: 0 })).toBe('E · Low E string · open');
    expect(describeAnchor({ stringIdx: 5, fret: 12 })).toBe('E · High E string · fret 12');
    const anchors = [
      { stringIdx: 0, fret: 0 },
      { stringIdx: 2, fret: 2 },
    ];
    for (const mode of ['major', 'minor', 'full'] as const) {
      renderFretWalk(anchors, 'intervals', mode);
      expect({
        board: element('#fret-walk-fretboard').innerHTML,
        header: element('#fret-walk-header').outerHTML,
      }).toMatchSnapshot(mode);
    }
    renderFretWalk([{ stringIdx: 5, fret: 22 }], 'notes', 'major');
    expect(element('#fret-walk-fretboard').innerHTML).toMatchSnapshot('highest anchor');
    renderFretWalk([], 'notes', 'major');
    expect(element('#fret-walk-fretboard').querySelectorAll('.note')).toHaveLength(0);
    renderDiscovery(new Set(NOTES), new Set([1, 2, 3, 4, 5, 6]), true);
    expect(element('#fretboard-discovery').innerHTML).toMatchSnapshot('grouped natural notes');
    renderDiscovery(new Set(['A', 'A#']), new Set([1, 6]), false);
    expect(element('#fretboard-discovery').innerHTML).toMatchSnapshot('selected strings');
    renderTriads(3, 'major', true);
    expect(element('#triads-page').innerHTML).toMatchSnapshot('major with orbit');
    renderTriads(11, 'minor', false);
    expect(element('#triads-page').innerHTML).toMatchSnapshot('minor voicings');
    renderTriads(3, 'major', true, {
      chords: [
        { rootIndex: 3, degree: 1, quality: 'major' },
        { rootIndex: 8, degree: 4, quality: 'minor' },
      ],
      activeStepIndex: 1,
    });
    expect(element('#triads-page').innerHTML).toMatchSnapshot('progression voicings');
    const config = getLayoutConfig();
    const board = element('#fretboard-discovery');
    const fret = fretCenterPosition(5, config);
    expect(fretCenterPosition(0, config)).toBe(25);
    expect(positionFromPoint(vertical ? 20 : fret, vertical ? fret : 20, board)).toEqual({
      fret: 5,
      stringIdx: vertical ? 0 : 5,
    });
  });
});
