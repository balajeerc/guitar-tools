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

  it.each([
    { keyIndex: 12 },
    { keyIndex: -1 },
    { keyIndex: 1.5 },
    { notes: [48], intervals: [] },
    { notes: [48, 49, 50, 51, 52], intervals: [1, 1, 1, 1] },
    { notes: [48, 144], intervals: [1] },
    { notes: [48, -1], intervals: [1] },
    { intervals: [1, 13] },
    { intervals: [1, -1] },
    { intervals: [1] },
    { intervals: null },
    { rootMidi: 49 },
  ])('rejects an invalid saved exercise: %j', (update) => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    const review = practice.reviews[0]!;
    localStorage.setItem(
      'ear-trainer-practice',
      JSON.stringify({
        ...practice,
        reviews: [{ ...review, exercise: { ...review.exercise, ...update } }],
      })
    );
    expect(loadPractice().reviews).toEqual([]);
  });

  it.each([
    { keyIndex: 11, notes: [131, 143], intervals: [12], rootMidi: null },
    { keyIndex: 0, notes: [0, 1, 2, 3], intervals: [1, 1, 1], rootMidi: 0 },
  ])('restores valid exercises at supported boundaries: %j', (exercise) => {
    const practice = loadPractice();
    recordAttempt(practice, exercise, settings, [true, false]);
    savePractice(practice);
    expect(loadPractice().reviews[0]?.exercise).toEqual(exercise);
  });

  it.each([{ context: 0 }, { streak: 2 }, { due: -1 }])(
    'rejects invalid saved review metadata: %j',
    (update) => {
      const practice = loadPractice();
      recordAttempt(practice, missed, settings, [true, false, false]);
      localStorage.setItem(
        'ear-trainer-practice',
        JSON.stringify({
          ...practice,
          reviews: [{ ...practice.reviews[0], ...update }],
        })
      );
      expect(loadPractice().reviews).toEqual([]);
    }
  );

  it('rejects invalid daily dates and retains a perfect daily score on reload', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, true, true]);
    savePractice(practice);
    expect(loadPractice().today).toEqual(practice.today);
    localStorage.setItem(
      'ear-trainer-practice',
      JSON.stringify({
        ...practice,
        today: { ...practice.today, date: 0 },
      })
    );
    expect(loadPractice().today.total).toBe(0);
  });

  it('caps imported review history and retains the most recent entries', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    const review = practice.reviews[0]!;
    localStorage.setItem(
      'ear-trainer-practice',
      JSON.stringify({
        ...practice,
        reviews: Array.from({ length: 55 }, (_, due) => ({ ...review, due })),
      })
    );
    const restored = loadPractice();
    expect(restored.reviews).toHaveLength(50);
    expect(restored.reviews[0]?.due).toBe(5);
    expect(restored.reviews[49]?.due).toBe(54);
  });

  it('chooses the oldest due phrase and spaces out multiple overdue reviews', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    recordAttempt(practice, fresh, settings, [true, false, false]);
    practice.reviews.reverse();
    practice.attempts = 20;
    expect(takeReview(practice, settings)).toEqual(missed);
    expect(takeReview(practice, settings)).toBeNull();
    practice.attempts = 22;
    expect(takeReview(practice, settings)).toBeNull();
    practice.attempts = 23;
    expect(takeReview(practice, settings)).toEqual(fresh);
  });

  it('keeps matching notes separate when the practice constraints or tonic differ', () => {
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    recordAttempt(practice, missed, { ...settings, octaveEnd: 4 }, [true, false, false]);
    expect(practice.reviews).toHaveLength(2);
    const randomSettings = { ...settings, fixedKey: false, playRootFirst: false };
    recordAttempt(practice, { ...missed, rootMidi: null }, randomSettings, [false, false, false]);
    recordAttempt(practice, { ...missed, rootMidi: null, keyIndex: 2 }, randomSettings, [
      false,
      false,
      false,
    ]);
    expect(practice.reviews).toHaveLength(4);
  });

  it('rolls over the daily score when the next answer is submitted after midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 23, 59));
    const practice = loadPractice();
    recordAttempt(practice, missed, settings, [true, false, false]);
    vi.setSystemTime(new Date(2026, 10, 15, 0, 1));
    recordAttempt(practice, fresh, settings, [true, true, true]);
    expect(practice.today).toEqual({ date: '2026-11-15', correct: 2, total: 2, rounds: 1 });
  });
});
