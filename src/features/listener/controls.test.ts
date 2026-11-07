import { describe, expect, it, vi } from 'vitest';

import { click, element, mountApp, settle } from '../../__fixtures__/browser';
import { requiredAt } from '../../shared/requiredAt';
import { initTunerFeature } from '../tuner';
import { updateMeterGlow, updateNeedle, updateTunerNoteDisplay } from '../tuner/renderer';

import { updateListenerDisplay } from './renderer';

import { initListenerFeature } from './index';

import type { AudioListenerCallbacks } from '../../__fixtures__/listenerTypes';

const state = vi.hoisted(() => ({ handlers: [] as AudioListenerCallbacks[] }));
vi.mock('../../shared/audioListener', () => ({
  createAudioListener: (callbacks: AudioListenerCallbacks) => {
    state.handlers.push(callbacks);
    let listening = false;
    return {
      isListening: () => listening,
      start: () => {
        listening = true;
        callbacks.onStart?.();
        return Promise.resolve();
      },
      stop: () => {
        listening = false;
        callbacks.onStop?.();
      },
    };
  },
}));

describe('live listener and tuner', () => {
  it('restores listener preferences and reflects each scale and accidental choice', () => {
    expect.hasAssertions();
    mountApp();
    localStorage.setItem(
      'listener-state',
      JSON.stringify({
        rootIndex: 4,
        mode: 'minor',
        accidental: 'flat',
      })
    );
    initListenerFeature();
    expect(element('#listener-page').innerHTML).toMatchSnapshot('restored listener');
    for (const [id, summary] of [
      ['listenerMajorBtn', 'Db Major'],
      ['listenerFullBtn', 'Db Full'],
      ['listenerMinorBtn', 'Db Minor'],
      ['listenerSharpBtn', 'C# Minor'],
      ['listenerFlatBtn', 'Db Minor'],
      ['listenerPrevNote', 'C Minor'],
      ['listenerNextNote', 'Db Minor'],
    ]) {
      click(`#${id}`);
      expect(element('#listenerControlsSummary').textContent).toBe(summary);
      expect(element('#listener-page').innerHTML).toMatchSnapshot(id);
    }
    expect(JSON.parse(localStorage.getItem('listener-state') ?? '{}')).toEqual({
      rootIndex: 4,
      mode: 'minor',
      accidental: 'flat',
    });
    click('#listenerControlsPanel .reset-link');
    expect(element('#listener-page').innerHTML).toMatchSnapshot('reset listener');
  });
  it('updates scale labels, degrees, note highlighting and fades on silence', async () => {
    vi.useFakeTimers();
    mountApp();
    initListenerFeature();
    expect(element('#listenerControlsSummary').textContent).toBe('C Major');
    click('#listenerPrevNote');
    click('#listenerNextNote');
    click('#listenerMinorBtn');
    click('#listenerFullBtn');
    expect(document.querySelectorAll('.scale-strip-note')).toHaveLength(12);
    click('#listenerFlatBtn');
    click('#listenerNextNote');
    expect(element('#listenerCurrentNote').textContent).toBe('Db');
    click('#listenerSharpBtn');
    expect(element('#listenerCurrentNote').textContent).toBe('C#');
    click('#listenerMajorBtn');
    click('#listenerToggleBtn');
    await settle();
    const handler = requiredAt(state.handlers, state.handlers.length - 1);
    expect(element('#listenerToggleBtn').textContent).toBe('Stop listening');
    handler.onNote({ name: 'C#', noteIndex: 4, midiNote: 61, centsOff: 4 });
    expect(element('#listenerNoteName').textContent).toBe('C#');
    expect(element('#listenerCents').textContent).toBe('+4¢');
    expect(element('#listenerDegree').textContent).toBe('1');
    expect(element('.scale-strip-note.active').getAttribute('data-note-index')).toBe('4');
    handler.onNote({ name: 'D', noteIndex: 5, midiNote: 62, centsOff: -8 });
    expect(element('#listenerDegree').textContent).toBe('?');
    expect(element('#listenerCents').classList.contains('out-of-tune')).toBe(true);
    handler.onNote(null);
    await vi.advanceTimersByTimeAsync(300);
    expect(element('#listenerNoteName').textContent).toBe('-');
    click('#listenerToggleBtn');
    expect(element('#listenerToggleBtn').textContent).toBe('Start listening');
    click('#listenerControlsPanel .reset-link');
    expect(element('#listenerControlsSummary').textContent).toBe('C Major');
    updateListenerDisplay(6, 'D#', null, 3, 'minor');
    expect(element('#listenerDegree').textContent).toBe('b3');
    updateListenerDisplay(4, 'C#', 0, 3, 'full');
    expect(element('#listenerDegree').textContent).toBe('b2');
    updateListenerDisplay(null, null, null, 3, 'full');
    updateListenerDisplay(null, null, null, 3, 'full');
    await vi.advanceTimersByTimeAsync(300);
    expect(element('.listener-display').classList.contains('fading')).toBe(true);
  });
  it('auto-matches strings by MIDI then pitch class and handles manual selection', async () => {
    expect.hasAssertions();
    mountApp();
    initTunerFeature();
    const handler = requiredAt(state.handlers, state.handlers.length - 1);
    expect(element('#tunerMeterSegments').innerHTML).toMatchSnapshot('idle meter geometry');
    click('#tunerToggleBtn');
    await settle();
    expect(element('#tunerToggleBtn').textContent).toBe('Stop listening');
    for (const note of [
      { name: 'E', noteIndex: 7, midiNote: 40, centsOff: -5 },
      { name: 'E', noteIndex: 7, midiNote: 64, centsOff: 0 },
      { name: 'A', noteIndex: 0, midiNote: 69, centsOff: 30 },
      { name: 'C', noteIndex: 3, midiNote: 60, centsOff: -50 },
    ]) {
      handler.onNote(note);
      expect({
        name: element('#tunerNoteName').textContent,
        cents: element('#tunerCents').outerHTML,
        needle: element('#tunerNeedle').outerHTML,
        segments: element('#tunerMeterSegments').innerHTML,
        strings: element('#tunerStrings').innerHTML,
      }).toMatchSnapshot(`${note.name}${note.midiNote}`);
    }
    click('.tuner-string-btn[data-string="1"]');
    expect(localStorage.getItem('tuner-state')).toBe('1');
    handler.onNote({ name: 'A', noteIndex: 0, midiNote: 45, centsOff: 5 });
    expect(element('.tuner-string-btn.active').getAttribute('data-string')).toBe('1');
    handler.onNote({ name: 'B', noteIndex: 2, midiNote: 47, centsOff: 6 });
    expect(element('.tuner-string-btn.active').getAttribute('data-string')).toBe('1');
    click('.tuner-string-btn[data-string="1"]');
    expect(localStorage.getItem('tuner-state')).toBe('null');
    handler.onNote(null);
    click('#tunerToggleBtn');
    expect(element('#tunerToggleBtn').textContent).toBe('Start listening');
    click('.tuner-reset-row .reset-link');
    expect(document.querySelector('.tuner-string-btn.active')).toBeNull();
    const needle = element('#tunerNeedle') as unknown as SVGLineElement;
    updateNeedle(needle, 100);
    expect(needle.getAttribute('transform')).toMatchSnapshot('clamped needle');
    updateNeedle(needle, -100);
    expect(needle.getAttribute('transform')).toMatchSnapshot('negative clamped needle');
    const segments = element('#tunerMeterSegments') as unknown as SVGGElement;
    updateMeterGlow(segments, 50);
    expect(segments.querySelectorAll('path[opacity="0.9"]')).toHaveLength(11);
    updateTunerNoteDisplay(element('#tunerNoteName'), element('#tunerCents'), null, null);
    expect(element('#tunerCents').className).toBe('tuner-cents');
  });
});
