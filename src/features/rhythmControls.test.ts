import { describe, expect, it, vi } from 'vitest';

import {
  audioHarness,
  change,
  click,
  element,
  frame,
  mountApp,
  settle,
} from '../__fixtures__/browser';

import { initBeatsFeature } from './beats';
import { initMetronomeFeature } from './metronome';

function saved(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? 'null');
}

function track(step: number): boolean[] {
  return Array.from({ length: 16 }, (_, index) => index === step);
}

describe('rhythm practice controls', () => {
  it('restores a saved tempo, pattern and individual track levels', () => {
    mountApp();
    const state = {
      bpm: 75,
      pattern: { kick: track(1), snare: track(2), hihat: track(3), crash: track(4) },
      levels: { kick: 0.11, snare: 0.22, hihat: 0.33, crash: 0.44 },
    };
    localStorage.setItem('beats-state', JSON.stringify(state));
    initBeatsFeature();
    expect(saved('beats-state')).toEqual(state);
    expect((element('#beatsBpmValue') as HTMLInputElement).value).toBe('75');
    expect(element('#beats-page').innerHTML).toMatchSnapshot('restored drum pattern and mixer');
  });

  it('restores metronome settings and synchronizes tempo, meter and subdivision controls', () => {
    expect.hasAssertions();
    mountApp();
    localStorage.setItem(
      'metronome-state',
      JSON.stringify({
        bpm: 120,
        beats: 3,
        subdivisions: 2,
        accents: ['strong', 'off', 'weak'],
      })
    );
    initMetronomeFeature();
    expect(element('#metronome-page').innerHTML).toMatchSnapshot('restored metronome');
    for (const [id, bpm] of [
      ['metronomeBpmUp', 121],
      ['metronomeBpmUpLarge', 131],
      ['metronomeBpmDown', 130],
      ['metronomeBpmDownLarge', 120],
    ] as const) {
      click(`#${id}`);
      expect((element('#metronomeBpmValue') as HTMLInputElement).value).toBe(String(bpm));
      expect(saved('metronome-state')).toMatchObject({ bpm });
    }
    for (const id of [
      'metronomeBeatsUp',
      'metronomeBeatsDown',
      'metronomeSubdiv1Btn',
      'metronomeSubdiv3Btn',
      'metronomeSubdiv2Btn',
      'metronomeSubdiv4Btn',
    ]) {
      click(`#${id}`);
      expect(element('#metronome-page').innerHTML).toMatchSnapshot(id);
    }
    const field = element('#metronomeBpmValue') as HTMLInputElement;
    field.focus();
    field.value = '80';
    click('#metronomeBpmUp');
    expect(field.value).toBe('80');
    expect((element('#metronomeBpmSlider') as HTMLInputElement).value).toBe('121');
    field.blur();
    expect(saved('metronome-state')).toMatchObject({ bpm: 80 });
  });
  it('persists individual tempo steps and restores an edited loop instead of the current grid', () => {
    expect.hasAssertions();
    mountApp();
    initBeatsFeature();
    const field = element('#beatsBpmValue') as HTMLInputElement;
    for (const [id, bpm] of [
      ['beatsBpmUp', 101],
      ['beatsBpmUpLarge', 111],
      ['beatsBpmDown', 110],
      ['beatsBpmDownLarge', 100],
    ] as const) {
      click(`#${id}`);
      expect(field.value).toBe(String(bpm));
      expect(saved('beats-state')).toMatchObject({ bpm });
    }
    field.focus();
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 3]);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(document.activeElement).toBe(field);
    field.blur();
    change('#beatsLoopName', '  Slow groove  ');
    change('#beatsBpmSlider', '70');
    click('.beats-cell[data-voice="kick"][data-step="1"]');
    click('#beatsLoopSave');
    const selected = (element('#beatsLoopSelect') as HTMLSelectElement).value;
    change('#beatsBpmSlider', '180');
    click('.beats-cell[data-voice="kick"][data-step="1"]');
    change('#beatsLoopSelect', selected);
    click('#beatsLoopLoad');
    expect((element('#beatsBpmValue') as HTMLInputElement).value).toBe('70');
    expect(
      element('.beats-cell[data-voice="kick"][data-step="1"]').getAttribute('aria-pressed')
    ).toBe('true');
    expect((element('#beatsLoopName') as HTMLInputElement).value).toBe('Slow groove');
    expect(saved('beats-state')).toMatchObject({ bpm: 70 });
    expect(element('#beatsLoopStatus').textContent).toBe('');
  });
  it('edits metronome tempo, meter, subdivisions and accents, starts and resets', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const audio = audioHarness();
    mountApp();
    initMetronomeFeature();
    expect(element('#metronomeControlsSummary').textContent).toBe('100 BPM · 4/4');
    for (const id of [
      'metronomeBpmUp',
      'metronomeBpmUpLarge',
      'metronomeBpmDown',
      'metronomeBpmDownLarge',
    ])
      click(`#${id}`);
    expect((element('#metronomeBpmValue') as HTMLInputElement).value).toBe('100');
    change('#metronomeBpmSlider', '150');
    expect(element('#metronomeControlsSummary').textContent).toBe('150 BPM · 4/4');
    const field = element('#metronomeBpmValue') as HTMLInputElement;
    field.focus();
    field.value = 'bad';
    field.blur();
    expect(field.value).toBe('150');
    field.focus();
    field.value = '90';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(field.value).toBe('90');
    click('#metronomeBeatsUp');
    click('#metronomeBeatsDown');
    click('#metronomeSubdiv3Btn');
    click('#metronomeBeats [data-beat="0"]');
    expect(saved('metronome-state')).toEqual({
      bpm: 90,
      beats: 4,
      subdivisions: 3,
      accents: ['weak', 'weak', 'weak', 'weak'],
    });
    click('#metronomeBeats [data-beat="0"]');
    click('#metronomeBeats [data-beat="0"]');
    click('#metronomeToggleBtn');
    await settle();
    expect(element('#metronomeToggleBtn').textContent).toBe('Stop');
    audio.context.currentTime = 10.1;
    frame(1);
    expect(element('#metronomeBeats .current').getAttribute('data-beat')).toBe('0');
    click('#metronome-controls .reset-link');
    expect(element('#metronomeToggleBtn').textContent).toBe('Start');
    expect(saved('metronome-state')).toEqual({
      bpm: 100,
      beats: 4,
      subdivisions: 1,
      accents: ['strong', 'weak', 'weak', 'weak'],
    });
    click('#metronomeToggleBtn');
    await settle();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(element('#metronomeToggleBtn').textContent).toBe('Start');
  });
  it('edits a drum grid, saves and loads loops and confirms deletion', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    vi.setSystemTime(12345);
    const audio = audioHarness();
    mountApp();
    initBeatsFeature();
    for (const id of ['beatsBpmUp', 'beatsBpmUpLarge', 'beatsBpmDown', 'beatsBpmDownLarge'])
      click(`#${id}`);
    change('#beatsBpmSlider', '120');
    const field = element('#beatsBpmValue') as HTMLInputElement;
    field.focus();
    field.value = 'invalid';
    field.blur();
    expect(field.value).toBe('120');
    field.focus();
    field.value = '90';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(field.value).toBe('90');
    click('.beats-cell[data-voice="kick"][data-step="1"]');
    expect(
      element('.beats-cell[data-voice="kick"][data-step="1"]').getAttribute('aria-pressed')
    ).toBe('true');
    change('.beats-level[data-level="snare"]', '0.5');
    expect(saved('beats-state')).toMatchObject({ bpm: 90, levels: { snare: 0.5 } });
    click('#beatsLoopSave');
    expect(element('#beatsLoopStatus').textContent).toBe('Enter a loop name first.');
    change('#beatsLoopName', 'Practice');
    element('#beatsLoopName').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(element('#beatsLoopStatus').textContent).toBe('Loop saved.');
    click('#beatsLoopSave');
    expect(element('#beatsLoopStatus').textContent).toBe('Loop updated.');
    const selected = (element('#beatsLoopSelect') as HTMLSelectElement).value;
    change('#beatsLoopSelect', '');
    expect((element('#beatsLoopLoad') as HTMLButtonElement).disabled).toBe(true);
    change('#beatsLoopSelect', selected);
    click('#beatsLoopLoad');
    expect((element('#beatsLoopName') as HTMLInputElement).value).toBe('Practice');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    click('#beatsLoopDelete');
    expect((element('#beatsLoopSelect') as HTMLSelectElement).options).toHaveLength(2);
    confirm.mockReturnValue(true);
    click('#beatsLoopDelete');
    expect(confirm).toHaveBeenLastCalledWith('Delete the loop “Practice”?');
    expect(element('#beatsLoopStatus').textContent).toBe('Loop deleted.');
    click('#beatsToggleBtn');
    await settle();
    expect(element('#beatsToggleBtn').textContent).toBe('Stop');
    audio.context.currentTime = 10.1;
    frame(1);
    expect(document.querySelector('.beats-cell.current')).not.toBeNull();
    click('#beatsReset .reset-link');
    expect(element('#beatsToggleBtn').textContent).toBe('Start');
    expect((element('#beatsBpmValue') as HTMLInputElement).value).toBe('100');
    click('#beatsToggleBtn');
    await settle();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(element('#beatsToggleBtn').textContent).toBe('Start');
  });
});
