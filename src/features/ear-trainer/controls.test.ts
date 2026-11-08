import { beforeEach, describe, expect, it, vi } from 'vitest';

import { audioHarness, change, click, element, mountApp, settle } from '../../__fixtures__/browser';

import { loadEarTrainerSettings, saveEarTrainerSettings } from './settings';
import { DEFAULT_EAR_TRAINER_SETTINGS } from './theory';

let initEarTrainerFeature: () => void;

describe('ear trainer user flow', () => {
  beforeEach(async () => {
    vi.resetModules();
    ({ initEarTrainerFeature } = await import('./index'));
  });
  it('keeps ascending enabled for root-first and restores direction editing when it is off', () => {
    mountApp();
    saveEarTrainerSettings({
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      playRootFirst: true,
      directions: ['descending'],
    });
    initEarTrainerFeature();
    const ascending = element('#earTrainerAscending') as HTMLInputElement;
    expect(ascending.checked).toBe(true);
    expect(ascending.disabled).toBe(true);
    click('#earTrainerAscending');
    expect(loadEarTrainerSettings().directions).toEqual(['ascending', 'descending']);
    expect(element('#earTrainerSettingsHint').textContent).toContain(
      'The first note is the lowest root'
    );
    click('#earTrainerPlayRootFirst');
    expect(ascending.disabled).toBe(false);
    click('#earTrainerAscending');
    expect(loadEarTrainerSettings().directions).toEqual(['descending']);
    click('#earTrainerPlayRootFirst');
    expect(ascending.checked).toBe(true);
    expect(ascending.disabled).toBe(true);
    expect(loadEarTrainerSettings().directions).toEqual(['ascending', 'descending']);
  });
  it('plays and labels a random-key phrase within the selected root-to-root range', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    const random = vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    mountApp();
    saveEarTrainerSettings({
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      octaveStart: 3,
      octaveEnd: 3,
      playRootFirst: true,
    });
    initEarTrainerFeature();
    for (const value of [10, 9, 7]) {
      random.mockImplementationOnce((array) => {
        (array as Uint32Array).fill(value);
        return array;
      });
    }
    click('#earTrainerNewBtn');
    expect(element('#earTrainerRoundLabel').textContent).toBe(
      'Oct 3–3 · Key G · Root first · Asc + desc'
    );
    expect(element('#earTrainerSettingsHint').textContent).toContain(
      "Notes stay from the key's root in octave 3 through its root in octave 4, inclusive."
    );
    click('#earTrainerPlayBtn');
    await settle();
    const frequencies = audio.events
      .filter(
        (event) =>
          event.method === 'frequency.set' && audio.nodes[event.node]?.kind === 'oscillator'
      )
      .map((event) => event.args[0]);
    expect(frequencies).toEqual([55, 65, 59].map((midi) => 440 * 2 ** ((midi - 69) / 12)));
    await vi.advanceTimersByTimeAsync(10_000);
    change('#earTrainerDegreeInput', '173');
    click('[data-ear-trainer-accidental="1"]');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerStatus').textContent).toBe('You got it!');
    expect(element('#earTrainerResult').textContent).toContain('G3 ↑ F4 ↓ B3');
    expect(element('#earTrainerResult').textContent).toContain('Key G · root G3.');
    expect(loadEarTrainerSettings().keyIndex).toBe(3);
    click('#earTrainerNewBtn');
    expect(element('#earTrainerRoundLabel').textContent).toContain('Key A ·');
    click('#earTrainerFixKey');
    expect(element('#earTrainerRoundLabel').textContent).toContain('Key C ·');
  });
  it('checks complete played answers, preserves the input caret and cancels stale playback', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    mountApp();
    initEarTrainerFeature();
    change('#earTrainerDegreeInput', '123');
    expect((element('#earTrainerCheckBtn') as HTMLButtonElement).disabled).toBe(true);
    click('#earTrainerPlayBtn');
    await settle();
    expect(element('#ear-trainer-page').innerHTML).toMatchSnapshot('playing exercise');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(element('#earTrainerHint').textContent).toBe(
      'Enter each note, then use the small buttons to add ♭ or ♯.'
    );
    expect((element('#earTrainerCheckBtn') as HTMLButtonElement).disabled).toBe(false);
    change('#earTrainerDegreeInput', '1');
    expect(element('#earTrainerStatus').textContent).toBe('1 of 3 notes entered');
    expect((element('#earTrainerCheckBtn') as HTMLButtonElement).disabled).toBe(true);
    const field = element('#earTrainerDegreeInput') as HTMLInputElement;
    field.value = '1x23';
    field.setSelectionRange(2, 2);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    expect(field.value).toBe('123');
    expect(field.selectionStart).toBe(2);
    click('#earTrainerCheckBtn');
    expect(element('#ear-trainer-page').innerHTML).toMatchSnapshot('incorrect exercise');
    click('#earTrainerPlayBtn');
    await settle();
    click('#earTrainerNewBtn');
    expect(
      audio.events.filter((event) => event.method === 'stop' && event.args.length === 0).length
    ).toBeGreaterThan(0);
    const initial = element('#earTrainerStatus').textContent;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(element('#earTrainerStatus').textContent).toBe(initial);
    expect((element('#earTrainerPlayBtn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('updates settings and round affordances after every individual selection', () => {
    expect.hasAssertions();
    mountApp();
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    initEarTrainerFeature();
    const page = element('#ear-trainer-page');
    expect(page.innerHTML).toMatchSnapshot('initial ear trainer');
    for (const id of [
      'earTrainerNotesUp',
      'earTrainerNotesDown',
      'earTrainerFixKey',
      'earTrainerKeyPrev',
      'earTrainerKeyNext',
      'earTrainerPlayRootFirst',
      'earTrainerTonewarmBtn',
      'earTrainerTonepureBtn',
      'earTrainerTonebrightBtn',
      'earTrainerTonepluckBtn',
      'earTrainerDescending',
      'earTrainerAscending',
    ]) {
      click(`#${id}`);
      expect(page.innerHTML).toMatchSnapshot(id);
    }
    change('#earTrainerDegreeInput', '1');
    expect((element('#earTrainerCheckBtn') as HTMLButtonElement).disabled).toBe(true);
    click('#earTrainerRevealBtn');
    expect(page.innerHTML).toMatchSnapshot('revealed exercise');
    click('#earTrainerNewBtn');
    expect((element('#earTrainerDegreeInput') as HTMLInputElement).disabled).toBe(false);
  });
  it('persists settings, constrains ranges, plays exercises and checks or reveals answers', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    audioHarness();
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(0);
      return array;
    });
    mountApp();
    saveEarTrainerSettings({
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      fixedKey: true,
      playRootFirst: true,
      keyIndex: 3,
      noteCount: 3,
      directions: ['ascending'],
    });
    expect(loadEarTrainerSettings()).toMatchObject({ fixedKey: true, keyIndex: 3 });
    initEarTrainerFeature();
    expect((element('#earTrainerDegreeInput') as HTMLInputElement).value).toBe('1');
    click('#earTrainerPlayBtn');
    await settle();
    expect(element('#earTrainerStatus').textContent).toBe('Listen carefully…');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(element('#earTrainerStatus').textContent).toBe('Which degrees did you hear?');
    change('#earTrainerDegreeInput', '111');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerStatus').textContent).toBe('1 of 3 notes correct');
    change('#earTrainerDegreeInput', '122');
    click('[data-ear-trainer-accidental="1"]');
    expect(element('#earTrainerStatus').textContent).toBe('Note 2 changed to ♭2');
    click('[data-ear-trainer-accidental="1"]');
    click('[data-ear-trainer-accidental="1"]');
    click('[data-ear-trainer-accidental="1"]');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerStatus').textContent).toBe('You got it!');
    expect(element('#earTrainerResult').hidden).toBe(false);
    expect(element('#earTrainerResult').innerHTML).toMatchSnapshot('correct exercise');
    expect(element('#ear-trainer-page').innerHTML).toMatchSnapshot('completed exercise');
    click('#earTrainerNewBtn');
    click('#earTrainerRevealBtn');
    expect(element('#earTrainerStatus').textContent).toBe('Answer revealed');
    click('#earTrainerNewBtn');
    for (const id of [
      'earTrainerNotesUp',
      'earTrainerNotesUp',
      'earTrainerNotesDown',
      'earTrainerNotesDown',
      'earTrainerNotesDown',
    ])
      click(`#${id}`);
    expect(element('#earTrainerNotesDisplay').textContent).toBe('2');
    click('#earTrainerKeyPrev');
    click('#earTrainerKeyNext');
    change('#earTrainerOctaveStart', '5');
    expect((element('#earTrainerOctaveEnd') as HTMLInputElement).value).toBe('5');
    change('#earTrainerOctaveEnd', '2');
    expect((element('#earTrainerOctaveStart') as HTMLInputElement).value).toBe('2');
    click('#earTrainerDescending');
    click('#earTrainerAscending');
    expect(loadEarTrainerSettings().directions).toEqual(['ascending', 'descending']);
    click('#earTrainerPlayRootFirst');
    click('#earTrainerAscending');
    expect(loadEarTrainerSettings().directions).toEqual(['descending']);
    click('#earTrainerDescending');
    expect((element('#earTrainerDescending') as HTMLInputElement).checked).toBe(true);
    click('#earTrainerFixKey');
    for (const tone of ['warm', 'pure', 'bright', 'pluck']) click(`#earTrainerTone${tone}Btn`);
    click('#earTrainerDegreeEntry');
    expect(document.activeElement?.id).toBe('earTrainerDegreeInput');
    click('#earTrainerReset .reset-link');
    expect(loadEarTrainerSettings()).toEqual(DEFAULT_EAR_TRAINER_SETTINGS);
    click('#earTrainerPlayBtn');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(element('#earTrainerStatus').textContent).toBe('Playback stopped');
    await vi.advanceTimersByTimeAsync(10_000);
  });
});
