import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  audioHarness,
  change,
  click,
  element,
  mockRandomValues,
  mountApp,
  settle,
} from '../../__fixtures__/browser';

import { loadPractice } from './practice';
import { loadEarTrainerSettings, saveEarTrainerSettings } from './settings';
import { DEFAULT_EAR_TRAINER_SETTINGS, normalizeSettings } from './theory';

let initEarTrainerFeature: () => void;

async function playRound() {
  click('#earTrainerPlayBtn');
  await settle();
  await vi.advanceTimersByTimeAsync(10_000);
}

describe('today’s ear trainer session', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    audioHarness();
    mockRandomValues();
    mountApp();
    saveEarTrainerSettings({
      ...DEFAULT_EAR_TRAINER_SETTINGS,
      fixedKey: true,
      playRootFirst: true,
      directions: ['ascending'],
    });
    ({ initEarTrainerFeature } = await import('./index'));
    initEarTrainerFeature();
  });

  it('defaults on for existing settings and only permits an explicit false to disable it', () => {
    expect(normalizeSettings({}).repeatMistakes).toBe(true);
    expect(normalizeSettings({ repeatMistakes: false }).repeatMistakes).toBe(false);
    expect(normalizeSettings({ repeatMistakes: null } as never).repeatMistakes).toBe(true);
    expect((element('#earTrainerRepeatMistakes') as HTMLInputElement).checked).toBe(true);
    expect(element('#earTrainerAccuracy').textContent).toBe('— first-try accuracy');
    expect(element('#earTrainerSession').hidden).toBe(false);
  });

  it('preserves first-check accuracy across retries, replays, reveals and reloads', async () => {
    await playRound();
    change('#earTrainerDegreeInput', '111');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerAccuracy').textContent).toBe('0% first-try accuracy');
    expect(element('#earTrainerSessionCount').textContent).toBe('0 of 2 notes · 1 exercise');
    await playRound();
    change('#earTrainerDegreeInput', '122');
    click('[data-ear-trainer-accidental="1"]');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerStatus').textContent).toBe('You got it!');
    expect(loadPractice().today).toMatchObject({ correct: 0, total: 2, rounds: 1 });
    expect(loadPractice().reviews).toHaveLength(1);
    initEarTrainerFeature();
    expect(element('#earTrainerAccuracy').textContent).toBe('0% first-try accuracy');
    click('#earTrainerNewBtn');
    expect(loadPractice().today.rounds).toBe(1);
    click('#earTrainerRevealBtn');
    expect(loadPractice().today).toMatchObject({ correct: 0, total: 4, rounds: 2 });
  });

  it('reports partial first-try success and returns a saved phrase for review', async () => {
    await playRound();
    change('#earTrainerDegreeInput', '112');
    click('#earTrainerCheckBtn');
    expect(element('#earTrainerAccuracy').textContent).toBe('50% first-try accuracy');
    expect(loadPractice().today.correct).toBe(1);
    mockRandomValues(1);
    for (let index = 0; index < 3; index++) {
      click('#earTrainerNewBtn');
      click('#earTrainerRevealBtn');
    }
    click('#earTrainerNewBtn');
    expect(element('#earTrainerHint').textContent).toBe(
      'A phrase to revisit. Listen and try again from memory.'
    );
  });

  it('persists the off setting, pauses tracking and restores existing progress when enabled', async () => {
    click('#earTrainerRevealBtn');
    const progress = loadPractice();
    click('#earTrainerRepeatMistakes');
    expect(loadEarTrainerSettings().repeatMistakes).toBe(false);
    expect(element('#earTrainerSession').hidden).toBe(true);
    await playRound();
    change('#earTrainerDegreeInput', '111');
    click('#earTrainerCheckBtn');
    click('#earTrainerRevealBtn');
    expect(loadPractice()).toEqual(progress);
    initEarTrainerFeature();
    expect((element('#earTrainerRepeatMistakes') as HTMLInputElement).checked).toBe(false);
    click('#earTrainerRepeatMistakes');
    expect(element('#earTrainerSession').hidden).toBe(false);
    expect(element('#earTrainerSessionCount').textContent).toBe('0 of 2 notes · 1 exercise');
  });
});
