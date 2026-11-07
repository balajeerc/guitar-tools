import { describe, expect, it, vi } from 'vitest';

import { click, element, mountApp } from '../__fixtures__/browser';

import { initBeatsFeature } from './beats';
import { setupLoopLibrary } from './beats/loopLibrary';
import { createDefaultPattern, DEFAULT_LEVELS } from './beats/pattern';
import { initCircleOfFifthsFeature } from './circle-of-fifths';
import { initEarTrainerFeature } from './ear-trainer';
import { initFretWalkFeature } from './fret-walk';
import { initFretboardDiscoveryFeature } from './fretboard-discovery';
import { initListenerFeature } from './listener';
import { initMelodiesFeature } from './melodies';
import { initMetronomeFeature } from './metronome';
import { initPlayByEarFeature } from './play-by-ear';
import { initTriadsFeature } from './triads';
import { initTunerFeature } from './tuner';

const initializers = [
  initBeatsFeature,
  initCircleOfFifthsFeature,
  initEarTrainerFeature,
  initFretWalkFeature,
  initFretboardDiscoveryFeature,
  initListenerFeature,
  initMelodiesFeature,
  initMetronomeFeature,
  initPlayByEarFeature,
  initTriadsFeature,
  initTunerFeature,
];

describe('optional page and control boundaries', () => {
  it.each(initializers)('does not initialize %s without its page', (init) => {
    expect(init).not.toThrow();
    expect(document.body.children).toHaveLength(0);
  });
  it.each([
    'beatsLoopName',
    'beatsLoopSelect',
    'beatsLoopSave',
    'beatsLoopLoad',
    'beatsLoopDelete',
    'beatsLoopStatus',
  ])('leaves an incomplete loop library alone when %s is missing', (missing) => {
    document.body.innerHTML =
      '<input id="beatsLoopName"><select id="beatsLoopSelect"></select><button id="beatsLoopSave"></button><button id="beatsLoopLoad"></button><button id="beatsLoopDelete"></button><span id="beatsLoopStatus"></span>';
    element(`#${missing}`).remove();
    const handlers = {
      getCurrentState: () => ({
        bpm: 100,
        pattern: createDefaultPattern(),
        levels: DEFAULT_LEVELS,
      }),
      onLoad: vi.fn(),
    };
    expect(() => {
      setupLoopLibrary(handlers);
    }).not.toThrow();
    expect(handlers.onLoad).not.toHaveBeenCalled();
  });
  it('keeps in-progress tempo edits and ignores invalid grid events', () => {
    mountApp();
    initBeatsFeature();
    const field = element('#beatsBpmValue') as HTMLInputElement;
    field.focus();
    field.value = '123';
    click('#beatsBpmUp');
    expect(field.value).toBe('123');
    expect((element('#beatsBpmSlider') as HTMLInputElement).value).toBe('101');
    field.blur();
    expect((element('#beatsBpmSlider') as HTMLInputElement).value).toBe('123');
    const original = localStorage.getItem('beats-state');
    const grid = element('#beatsGrid');
    grid.insertAdjacentHTML(
      'beforeend',
      '<button id="invalidVoice" class="beats-cell" data-voice="piano" data-step="0"></button><button id="invalidStep" class="beats-cell" data-voice="kick" data-step="1.5"></button><input id="invalidLevel" class="beats-level" data-level="piano" value="1">'
    );
    click('#invalidVoice');
    click('#invalidStep');
    element('#invalidLevel').dispatchEvent(new Event('input', { bubbles: true }));
    grid.click();
    grid.dispatchEvent(new Event('input', { bubbles: true }));
    expect(localStorage.getItem('beats-state')).toBe(original);
    field.remove();
    expect(() => {
      click('#beatsBpmUp');
    }).not.toThrow();
    element('#beatsBpmSlider').remove();
    expect(() => {
      click('#beatsBpmUp');
    }).not.toThrow();
  });
});
