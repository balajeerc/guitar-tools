import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  audioHarness,
  change,
  click,
  element,
  frame,
  mountApp,
  settle,
} from '../../__fixtures__/browser';
import { requiredAt } from '../../shared/requiredAt';
import { frequencyToNote } from '../note-detection/noteMapper';

import { pickMelody } from './catalog';
import { appendMelody, canMoveHistory, createMelodyHistory, moveHistory } from './history';
import { melodyResultHtml } from './result';
import { loadMelodyTone } from './toneControl';

let initMelodiesFeature: () => void;

import type { AudioListenerCallbacks } from '../../__fixtures__/listenerTypes';

const listenerState = vi.hoisted(() => ({
  handlers: [] as AudioListenerCallbacks[],
  active: false,
  failure: false,
}));
vi.mock('../../shared/audioListener', () => ({
  createAudioListener: (callbacks: AudioListenerCallbacks) => {
    listenerState.handlers.push(callbacks);
    return {
      isListening: () => listenerState.active,
      start: () => {
        if (listenerState.failure) return Promise.reject(new Error('input denied'));
        listenerState.active = true;
        callbacks.onStart?.();
        return Promise.resolve();
      },
      stop: () => {
        listenerState.active = false;
        callbacks.onStop?.();
      },
    };
  },
}));

function startGame(): ReturnType<typeof audioHarness> {
  vi.useFakeTimers();
  vi.advanceTimersByTime(5000);
  const audio = audioHarness();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    (array as Uint32Array).fill(0);
    return array;
  });
  mountApp();
  initMelodiesFeature();
  return audio;
}

function acceptMidi(callbacks: AudioListenerCallbacks, midi: number): void {
  const note = frequencyToNote(440 * 2 ** ((midi - 69) / 12));
  callbacks.onNote(null);
  callbacks.onNote(note);
  vi.advanceTimersByTime(110);
  callbacks.onNote(note);
}

describe('mystery melody game', () => {
  beforeEach(async () => {
    vi.resetModules();
    ({ initMelodiesFeature } = await import('./index'));
    listenerState.active = false;
    listenerState.failure = false;
  });

  it('keeps the attempt clock running across replays', async () => {
    startGame();
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    frame(20_000);
    expect(element('#melodiesTimer').textContent).toBe('0:20.0');
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    frame(40_000);
    expect(element('#melodiesTimer').textContent).toBe('0:40.0');
  });
  it('focuses manual entry and preserves an attempt when selected controls are clicked again', async () => {
    startGame();
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    click('#melodiesManualMethodBtn');
    click('#melodiesIntervalEntry');
    expect(document.activeElement?.id).toBe('melodiesIntervalInput');
    change('#melodiesKeyInput', 'C major');
    expect(element('#melodiesStatus').textContent).toBe('Enter the interval pattern');
    change('#melodiesIntervalInput', '123');
    const field = element('#melodiesIntervalInput') as HTMLInputElement;
    field.setSelectionRange(0, 0);
    click('#melodiesIntervalEntry');
    expect(field.selectionStart).toBe(3);
    change('#melodiesKeyInput', '');
    expect(element('#melodiesStatus').textContent).toBe('3 of 8 intervals entered');
    const before = element('#melodies-page').innerHTML;
    click('#melodiesManualMethodBtn');
    click('#melodiesEasyBtn');
    expect(element('#melodies-page').innerHTML).toBe(before);
  });
  it('keeps same-route media active and stops audio and microphone when leaving', async () => {
    const audio = startGame();
    window.history.replaceState(null, '', '#melodies');
    click('#melodiesPlayBtn');
    await settle();
    const stops = (): number =>
      audio.events.filter((event) => event.method === 'stop' && event.args.length === 0).length;
    const before = stops();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(stops()).toBe(before);
    click('#melodiesGuessBtn');
    await settle();
    expect(listenerState.active).toBe(true);
    window.history.replaceState(null, '', '#scales');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(listenerState.active).toBe(false);
    expect(stops()).toBeGreaterThan(before);
  });
  it('reflects a complete microphone attempt, mistakes, tone selection and finished controls', async () => {
    expect.hasAssertions();
    const audio = startGame();
    const page = element('#melodies-page');
    click('#melodiesTonebrightBtn');
    click('#melodiesPlayBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('microphone melody playing');
    expect(audio.nodes.find((node) => node.kind === 'oscillator')?.type).toBe('sawtooth');
    await vi.advanceTimersByTimeAsync(20_000);
    frame(20_000);
    expect(page.innerHTML).toMatchSnapshot('microphone melody ready');
    click('#melodiesGuessBtn');
    expect(page.innerHTML).toMatchSnapshot('opening melody microphone');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('active melody microphone');
    const handler = requiredAt(listenerState.handlers, listenerState.handlers.length - 1);
    const melody = pickMelody('easy');
    const first = requiredAt(melody.notes, 0).midi;
    acceptMidi(handler, first);
    expect(page.innerHTML).toMatchSnapshot('first melody note matched');
    acceptMidi(handler, first + 1);
    expect(element('#melodiesStatus').textContent).toBe('That note doesn’t match yet');
    expect(page.innerHTML).toMatchSnapshot('incorrect melody note');
    for (const note of melody.notes) acceptMidi(handler, note.midi);
    expect(element('#melodiesStatus').textContent).toBe('You got it!');
    expect(page.innerHTML).toMatchSnapshot('completed microphone melody');
    const completed = page.innerHTML;
    acceptMidi(handler, first + 1);
    expect(page.innerHTML).toBe(completed);
    click('#melodiesNewBtn');
    expect(page.innerHTML).toMatchSnapshot('fresh microphone melody');
  });
  it('reflects partial and corrected manual guesses, root controls and history navigation', async () => {
    expect.hasAssertions();
    startGame();
    const page = element('#melodies-page');
    click('#melodiesRootToggle');
    expect(localStorage.getItem('melodies-show-root')).toBe('true');
    expect(page.innerHTML).toMatchSnapshot('visible melody root');
    click('#melodiesManualMethodBtn');
    expect(localStorage.getItem('melodies-guess-method')).toBe(JSON.stringify('manual'));
    expect(page.innerHTML).toMatchSnapshot('manual melody selected');
    click('#melodiesPlayBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('manual melody playing');
    await vi.advanceTimersByTimeAsync(20_000);
    change('#melodiesIntervalInput', '1');
    expect(page.innerHTML).toMatchSnapshot('partial manual melody');
    for (const label of ['flat', 'sharp', 'natural']) {
      click('[data-melodies-accidental="0"]');
      expect(page.innerHTML).toMatchSnapshot(label);
    }
    const melody = pickMelody('easy');
    change('#melodiesIntervalInput', '1'.repeat(melody.degrees.length));
    click('#melodiesCheckBtn');
    expect(page.innerHTML).toMatchSnapshot('incorrect manual melody');
    change('#melodiesIntervalInput', melody.degrees.join(''));
    change('#melodiesKeyInput', melody.key);
    click('#melodiesCheckBtn');
    expect(element('#melodiesStatus').textContent).toBe('You got it!');
    expect(page.innerHTML).toMatchSnapshot('completed manual melody');
    click('#melodiesNewBtn');
    click('#melodiesPreviousBtn');
    expect(page.innerHTML).toMatchSnapshot('previous melody round');
    click('#melodiesNextBtn');
    expect(page.innerHTML).toMatchSnapshot('next melody round');
    click('#melodiesMediumBtn');
    expect(localStorage.getItem('melodies-difficulty')).toBe(JSON.stringify('medium'));
    expect(page.innerHTML).toMatchSnapshot('medium melody selected');
    click('#melodiesHardBtn');
    expect(page.innerHTML).toMatchSnapshot('hard melody selected');
  });
  it('reports denied microphone access, retries and stops input when switching methods', async () => {
    startGame();
    const page = element('#melodies-page');
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    listenerState.failure = true;
    click('#melodiesGuessBtn');
    await settle();
    expect(element('#melodiesStatus').textContent).toBe('Microphone access is needed');
    expect(element('#melodiesHint').textContent).toBe(
      'Allow microphone access in your browser, then try again.'
    );
    listenerState.failure = false;
    click('#melodiesGuessBtn');
    await settle();
    click('#melodiesManualMethodBtn');
    expect(listenerState.active).toBe(false);
    expect(page.innerHTML).toMatchSnapshot('manual method after microphone');
    click('#melodiesMicMethodBtn');
    expect(page.innerHTML).toMatchSnapshot('microphone method restored');
  });
  it.each(['medium', 'hard'] as const)(
    'restores %s difficulty, manual mode, root and tone preferences',
    (difficulty) => {
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
        (array as Uint32Array).fill(0);
        return array;
      });
      localStorage.setItem('melodies-difficulty', JSON.stringify(difficulty));
      localStorage.setItem('melodies-guess-method', JSON.stringify('manual'));
      localStorage.setItem('melodies-show-root', 'true');
      localStorage.setItem('melodies-tone', JSON.stringify('pure'));
      mountApp();
      initMelodiesFeature();
      expect(element('#melodiesRootValue').hidden).toBe(false);
      expect(element('#melodies-page').innerHTML).toMatchSnapshot();
    }
  );
  it('falls back from invalid persisted difficulty and method preferences', () => {
    localStorage.setItem('melodies-difficulty', JSON.stringify('broken'));
    localStorage.setItem('melodies-guess-method', JSON.stringify('broken'));
    startGame();
    expect(element('#melodiesRoundLabel').textContent).toContain('Easy');
    expect(element('#melodiesManualPanel').hidden).toBe(true);
  });

  it('times the active attempt, freezes the result and locks finished answers', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    audioHarness();
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    mountApp();
    initMelodiesFeature();
    const page = element('#melodies-page');
    expect(page.innerHTML).toMatchSnapshot('ready melody');
    click('#melodiesManualMethodBtn');
    click('#melodiesPlayBtn');
    await settle();
    expect((element('#melodiesPlayBtn') as HTMLButtonElement).disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(element('#melodiesTimer').textContent).toBe('0:00.0');
    vi.advanceTimersByTime(1500);
    frame(1500);
    expect(element('#melodiesTimer').textContent).toBe('0:21.5');
    expect(page.innerHTML).toMatchSnapshot('guessing melody');
    click('#melodiesRevealBtn');
    const completed = element('#melodiesTimer').textContent;
    expect(page.innerHTML).toMatchSnapshot('revealed melody');
    vi.advanceTimersByTime(5000);
    frame(6500);
    expect(element('#melodiesTimer').textContent).toBe(completed);
    click('#melodiesNewBtn');
    expect(element('#melodiesTimer').textContent).toBe('0:00.0');
    expect((element('#melodiesPlayBtn') as HTMLButtonElement).disabled).toBe(false);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  it('plays, scores manual answers, switches methods, browses history and reveals harder tunes', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    audioHarness();
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    mountApp();
    initMelodiesFeature();
    expect(element('#melodiesStatus').textContent).toBe('Listen first, then play it back');
    expect((element('#melodiesGuessBtn') as HTMLButtonElement).disabled).toBe(true);
    click('#melodiesRootToggle');
    expect(element('#melodiesRootValue').hidden).toBe(false);
    click('#melodiesRootToggle');
    click('#melodiesManualMethodBtn');
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(element('#melodiesStatus').textContent).toBe('Enter the interval pattern');
    const melody = pickMelody('easy');
    change('#melodiesIntervalInput', '1'.repeat(melody.degrees.length));
    click('#melodiesCheckBtn');
    expect(element('#melodiesStatus').textContent).toContain('intervals are right');
    change('#melodiesKeyInput', 'C major');
    change('#melodiesIntervalInput', melody.degrees.join(''));
    click('#melodiesIntervalEntry');
    expect(document.activeElement?.id).toBe('melodiesIntervalInput');
    click('[data-melodies-accidental="0"]');
    click('[data-melodies-accidental="0"]');
    click('[data-melodies-accidental="0"]');
    click('#melodiesCheckBtn');
    expect(element('#melodiesStatus').textContent).toBe('You got it!');
    expect(element('#melodiesResult').textContent).toContain('Ode to Joy');
    click('#melodiesNewBtn');
    expect(element('#melodiesRoundLabel').textContent).toContain('Tune 2 of 2');
    click('#melodiesPreviousBtn');
    expect(element('#melodiesRoundLabel').textContent).toContain('Tune 1 of 2');
    click('#melodiesNextBtn');
    click('#melodiesMicMethodBtn');
    click('#melodiesPlayBtn');
    await settle();
    await vi.advanceTimersByTimeAsync(20_000);
    click('#melodiesGuessBtn');
    await settle();
    expect(element('#melodiesStatus').textContent).toBe('Play the phrase back');
    const handler = requiredAt(listenerState.handlers, listenerState.handlers.length - 1);
    handler.onNote(null);
    handler.onNote({ name: 'C', noteIndex: 3, midiNote: 60, centsOff: 0 });
    vi.advanceTimersByTime(110);
    handler.onNote({ name: 'C', noteIndex: 3, midiNote: 60, centsOff: 0 });
    expect(element('#melodiesDetectedNote').textContent).toBe('C4');
    click('#melodiesGuessBtn');
    expect(element('#melodiesStatus').textContent).toBe('Microphone stopped');
    for (const tone of ['warm', 'pure', 'bright', 'pluck']) click(`#melodiesTone${tone}Btn`);
    expect(loadMelodyTone()).toBe('pluck');
    click('#melodiesMediumBtn');
    expect(element('#melodiesRoundLabel').textContent).toContain('Medium');
    click('#melodiesHardBtn');
    expect(element('#melodiesRoundLabel').textContent).toContain('Hard');
    click('#melodiesRevealBtn');
    expect(element('#melodiesStatus').textContent).toBe('Melody revealed');
    expect(element('#melodiesResult').textContent).toContain('Answer revealed');
    click('#melodiesEasyBtn');
    click('#melodiesPlayBtn');
    click('#melodiesNewBtn');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(element('#melodiesStatus').textContent).toBe('Listen first, then play it back');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  it('truncates forward history and renders accurate score/key feedback', () => {
    const first = pickMelody('easy');
    const second = pickMelody('medium');
    const third = pickMelody('hard');
    const history = createMelodyHistory(first);
    expect(moveHistory(history, -1)).toBeNull();
    appendMelody(history, second);
    expect(canMoveHistory(history, 1)).toBe(false);
    expect(moveHistory(history, -1)).toBe(first);
    appendMelody(history, third);
    expect(history.entries).toEqual([first, third]);
    const result = {
      attemptAccuracy: 80,
      complete: true,
      expectedInterval: 0,
      matched: true,
      matchedNotes: 4,
      playedInterval: 0,
      totalNotes: 4,
    };
    const options = {
      melody: first,
      result,
      revealed: false,
      elapsedMs: 30_000,
      manual: true,
      answerBasis: 'first-note',
      keyGuess: first.key,
    } as const;
    expect(melodyResultHtml(options)).toContain('400 points');
    expect(melodyResultHtml(options)).toContain(`Key: ${first.key} ✓`);
    expect(melodyResultHtml(options)).toContain('you treated the first heard note as 1');
    expect(
      melodyResultHtml({ ...options, manual: false, answerBasis: null, keyGuess: 'Wrong' })
    ).toContain(`Key was ${first.key}`);
    expect(melodyResultHtml({ ...options, keyGuess: '' })).not.toContain('Key:');
    expect(melodyResultHtml({ ...options, revealed: true })).toContain('Answer revealed');
  });
});
