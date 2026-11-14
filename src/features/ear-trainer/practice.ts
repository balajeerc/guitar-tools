import { loadPersisted, savePersisted } from '../../shared/persist';

import { type EarTrainerExercise, type EarTrainerSettings } from './theory';

interface DailySession {
  correct: number;
  date: string;
  rounds: number;
  total: number;
}

interface Review {
  context: string;
  due: number;
  exercise: EarTrainerExercise;
  streak: number;
}

export interface EarTrainerPractice {
  attempts: number;
  nextReviewAt: number;
  reviews: Review[];
  today: DailySession;
}

const STORAGE_KEY = 'ear-trainer-practice';
const REVIEW_GAP = 3;
const MAX_REVIEWS = 50;

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function emptySession(): DailySession {
  return { date: localDate(), correct: 0, total: 0, rounds: 0 };
}

export function refreshSession(practice: EarTrainerPractice): void {
  if (practice.today.date !== localDate()) practice.today = emptySession();
}

export function resetTodaySession(practice: EarTrainerPractice): void {
  practice.today = emptySession();
}

function practiceContext(settings: EarTrainerSettings): string {
  return JSON.stringify([
    settings.octaveStart,
    settings.octaveEnd,
    settings.noteCount,
    settings.directions,
    settings.playRootFirst,
    settings.fixedKey ? settings.keyIndex : null,
    settings.majorMinorOnly,
  ]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isExercise(value: unknown): value is EarTrainerExercise {
  if (!isRecord(value) || !Array.isArray(value.notes) || !Array.isArray(value.intervals)) {
    return false;
  }
  return (
    isKeyIndex(value.keyIndex) &&
    isNotes(value.notes) &&
    value.intervals.length === value.notes.length - 1 &&
    value.intervals.every((interval: unknown) => isCount(interval) && interval <= 12) &&
    (value.rootMidi === null || value.rootMidi === value.notes[0])
  );
}

function isKeyIndex(value: unknown): boolean {
  return isCount(value) && value < 12;
}

function isNotes(notes: readonly unknown[]): boolean {
  return (
    notes.length >= 2 && notes.length <= 4 && notes.every((note) => isCount(note) && note <= 143)
  );
}

function isReview(value: unknown): value is Review {
  return (
    isRecord(value) &&
    typeof value.context === 'string' &&
    isCount(value.due) &&
    isCount(value.streak) &&
    value.streak < 2 &&
    isExercise(value.exercise)
  );
}

function isSession(value: unknown): value is DailySession {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    isCount(value.correct) &&
    isCount(value.total) &&
    isCount(value.rounds) &&
    value.correct <= value.total
  );
}

export function loadPractice(): EarTrainerPractice {
  const stored = loadPersisted<unknown>(STORAGE_KEY, null);
  if (!isRecord(stored) || !isCount(stored.attempts) || !isCount(stored.nextReviewAt)) {
    return { attempts: 0, nextReviewAt: 0, reviews: [], today: emptySession() };
  }
  const practice = {
    attempts: stored.attempts,
    nextReviewAt: stored.nextReviewAt,
    reviews: Array.isArray(stored.reviews)
      ? stored.reviews.filter(isReview).slice(-MAX_REVIEWS)
      : [],
    today: isSession(stored.today) ? stored.today : emptySession(),
  };
  refreshSession(practice);
  return practice;
}

export function savePractice(practice: EarTrainerPractice): void {
  savePersisted(STORAGE_KEY, practice);
}

export function takeReview(
  practice: EarTrainerPractice,
  settings: EarTrainerSettings
): EarTrainerExercise | null {
  if (!settings.repeatMistakes || practice.attempts < practice.nextReviewAt) return null;
  const context = practiceContext(settings);
  const review = practice.reviews
    .filter((item) => item.context === context && item.due <= practice.attempts)
    .sort((a, b) => a.due - b.due)[0];
  if (!review) return null;
  practice.nextReviewAt = practice.attempts + REVIEW_GAP;
  review.due = practice.nextReviewAt;
  return review.exercise;
}

function updateReview(
  practice: EarTrainerPractice,
  exercise: EarTrainerExercise,
  settings: EarTrainerSettings,
  correct: boolean
): void {
  const context = practiceContext(settings);
  const existing = practice.reviews.find(
    (review) =>
      review.context === context &&
      review.exercise.keyIndex === exercise.keyIndex &&
      review.exercise.notes.join(',') === exercise.notes.join(',')
  );
  if (!existing && correct) return;
  const review = existing ?? { context, exercise, due: 0, streak: 0 };
  review.streak = correct ? review.streak + 1 : 0;
  review.due = practice.attempts + REVIEW_GAP * (review.streak + 1);
  if (!existing) practice.reviews.push(review);
  practice.reviews = practice.reviews.filter((item) => item.streak < 2).slice(-MAX_REVIEWS);
}

export function recordAttempt(
  practice: EarTrainerPractice,
  exercise: EarTrainerExercise,
  settings: EarTrainerSettings,
  judgement: readonly boolean[]
): void {
  refreshSession(practice);
  const scored = settings.playRootFirst ? judgement.slice(1) : judgement;
  practice.attempts += 1;
  practice.today.rounds += 1;
  practice.today.total += scored.length;
  practice.today.correct += scored.filter(Boolean).length;
  updateReview(practice, exercise, settings, scored.every(Boolean));
}
