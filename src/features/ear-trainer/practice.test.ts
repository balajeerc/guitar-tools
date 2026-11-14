import { describe, expect, it, vi } from 'vitest';

import { loadPractice, recordAttempt, refreshSession, savePractice, takeReview } from './practice';
import { createExercise, DEFAULT_EAR_TRAINER_SETTINGS } from './theory';

const settings = { ...DEFAULT_EAR_TRAINER_SETTINGS, fixedKey: true, playRootFirst: true };
const missed = createExercise(settings, () => 0);
const fresh = createExercise(settings, (length) => length - 1);

function advancePractice(practice: ReturnType<typeof loadPractice>, count: number) {
  for (let index = 0; index < count; index++) {
    recordAttempt(practice, fresh, settings, [true, true, true]);
  }
}

describe('adaptive ear practice', () => {
  it('spaces missed phrases, persists them and clears them after two first-try successes', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, true]);
    expect(practice.today).toMatchObject({ correct: 1, total: 2, rounds: 1 });
    expect(takeReview(practice, settings)).toBeNull();
    advancePractice(practice, 2);
    expect(takeReview(practice, settings)).toBeNull();
    advancePractice(practice, 1);
    savePractice(practice);
    const restored = loadPractice();
    expect(takeReview(restored, settings)).toEqual(missed);
    expect(takeReview(restored, settings)).toBeNull();
    recordAttempt(restored, missed, settings, [true, true, true]);
    advancePractice(restored, 5);
    expect(takeReview(restored, settings)).toBeNull();
    advancePractice(restored, 1);
    expect(takeReview(restored, settings)).toEqual(missed);
    recordAttempt(restored, missed, settings, [true, true, true]);
    expect(restored.reviews).toEqual([]);
  });

  it('resets the success streak when the phrase is missed again', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    recordAttempt(practice, missed, settings, [true, true, true]);
    recordAttempt(practice, missed, settings, [true, false, false]);
    expect(practice.reviews).toHaveLength(1);
    expect(practice.reviews[0]).toMatchObject({ streak: 0, due: 6 });
  });

  it('reviews only phrases matching the current constraints and respects the off setting', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    advancePractice(practice, 3);
    expect(takeReview(practice, { ...settings, repeatMistakes: false })).toBeNull();
    expect(takeReview(practice, { ...settings, noteCount: 4 })).toBeNull();
    expect(takeReview(practice, { ...settings, majorMinorOnly: true })).toBeNull();
    expect(takeReview(practice, { ...settings, keyIndex: 2 })).toBeNull();
    expect(takeReview(practice, { ...settings, tone: 'pure' })).toEqual(missed);
  });

  it('keeps random-key reviews available when the unused key selector changes', () => {
    const practice = loadPractice();
    const randomSettings = { ...settings, fixedKey: false };
    recordAttempt(practice, missed, randomSettings, [true, false, false]);
    practice.attempts += 3;
    expect(takeReview(practice, { ...randomSettings, keyIndex: 5 })).toEqual(missed);
  });

  it('starts a new local day without losing review history', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 23, 59));
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    savePractice(practice);
    expect(loadPractice().today).toMatchObject({ date: '2026-11-14', total: 2 });
    vi.setSystemTime(new Date(2026, 10, 15, 0, 1));
    const restored = loadPractice();
    expect(restored.today).toEqual({ date: '2026-11-15', correct: 0, total: 0, rounds: 0 });
    expect(restored.reviews).toHaveLength(1);
    recordAttempt(restored, missed, settings, [true, true, true]);
    expect(restored.today).toMatchObject({ correct: 2, total: 2, rounds: 1 });
    vi.setSystemTime(new Date(2026, 10, 16));
    refreshSession(restored);
    expect(restored.today.total).toBe(0);
  });

  it('counts every note when there is no prefilled root and bounds saved review history', () => {
    const practice = loadPractice();
    const unprefilled = { ...settings, playRootFirst: false, fixedKey: false };
    for (let index = 0; index < 55; index++) {
      const exercise = { ...missed, rootMidi: null, notes: [index, index + 1, index + 2] };
      recordAttempt(practice, exercise, unprefilled, [false, false, false]);
    }
    expect(practice.today).toMatchObject({ correct: 0, total: 165, rounds: 55 });
    expect(practice.reviews).toHaveLength(50);
    expect(practice.reviews[0]?.exercise.notes).toEqual([5, 6, 7]);
  });

  it.each([null, [], { attempts: -1 }, { attempts: 0, nextReviewAt: '0' }])(
    'recovers from invalid stored progress: %j',
    (stored) => {
      localStorage.setItem('ear-trainer-practice', JSON.stringify(stored));
      expect(loadPractice()).toMatchObject({ attempts: 0, nextReviewAt: 0, reviews: [] });
    }
  );

  it('drops malformed reviews and daily totals while preserving valid records', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, true]);
    localStorage.setItem(
      'ear-trainer-practice',
      JSON.stringify({
        ...practice,
        today: { ...practice.today, correct: 3 },
        reviews: [
          ...practice.reviews,
          null,
          { context: 'bad', streak: -1 },
          { ...practice.reviews[0], exercise: { ...missed, notes: null } },
          { ...practice.reviews[0], exercise: { ...missed, notes: [-1, 1, 2] } },
        ],
      })
    );
    const restored = loadPractice();
    expect(restored.reviews).toEqual(practice.reviews);
    expect(restored.today.total).toBe(0);
    localStorage.setItem('ear-trainer-practice', JSON.stringify({ attempts: 0, nextReviewAt: 0 }));
    expect(loadPractice().reviews).toEqual([]);
  });
});
