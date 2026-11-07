import { describe, expect, it } from 'vitest';

import { createSlidingMelodyMatcher } from '../play-by-ear/slidingMatcher';

import { createMelodyMatcher } from './matcher';
import { createNoteGate } from './noteGate';

describe('melody shape recognition', () => {
  it('accepts transposition, tolerates wrong notes, and scores attempts', () => {
    const matcher = createMelodyMatcher([60, 64, 67]);
    expect(matcher.add(69)).toEqual({
      matched: true,
      complete: false,
      matchedNotes: 1,
      totalNotes: 3,
      attemptAccuracy: 100,
      expectedInterval: 0,
      playedInterval: 0,
    });
    expect(matcher.add(70)).toEqual({
      matched: false,
      complete: false,
      matchedNotes: 1,
      totalNotes: 3,
      attemptAccuracy: 50,
      expectedInterval: 4,
      playedInterval: 1,
    });
    expect(matcher.add(73)).toMatchObject({ matched: true, matchedNotes: 2, attemptAccuracy: 67 });
    expect(matcher.add(64)).toMatchObject({
      complete: true,
      matchedNotes: 3,
      attemptAccuracy: 75,
      playedInterval: 7,
    });
    matcher.reset();
    expect(matcher.add(48)).toMatchObject({ matched: true, matchedNotes: 1, attemptAccuracy: 100 });
  });
  it('has defined behavior for an empty expected phrase', () => {
    expect(createMelodyMatcher([]).add(60)).toMatchObject({
      totalNotes: 0,
      matchedNotes: 1,
      complete: false,
    });
  });
  it('finds the melody after a false start and skips sustained repetitions', () => {
    const matcher = createSlidingMelodyMatcher([60, 60, 64, 67]);
    expect(matcher.add(70)).toMatchObject({ matchedNotes: 1 });
    expect(matcher.add(69)).toMatchObject({ matchedNotes: 1, matched: false, attemptAccuracy: 50 });
    expect(matcher.add(73)).toMatchObject({ matchedNotes: 3, matched: true });
    expect(matcher.add(76)).toMatchObject({
      matchedNotes: 4,
      complete: true,
      playedInterval: 7,
      expectedInterval: 7,
    });
    matcher.reset();
    expect(matcher.add(48)).toMatchObject({
      matchedNotes: 1,
      attemptAccuracy: 100,
      complete: false,
    });
    expect(createSlidingMelodyMatcher([]).add(60)).toMatchObject({
      matchedNotes: 0,
      totalNotes: 0,
      complete: true,
    });
  });
});

describe('stable note gate', () => {
  const a = { name: 'A', noteIndex: 0, midiNote: 69, centsOff: 0 };
  const b = { name: 'B', noteIndex: 2, midiNote: 71, centsOff: 0 };
  it('emits only at the stability boundary and once per attack', () => {
    const gate = createNoteGate();
    expect(gate.update(a, 100)).toBeNull();
    expect(gate.update(a, 209)).toBeNull();
    expect(gate.update(a, 210)).toBe(a);
    expect(gate.update(a, 999)).toBeNull();
    expect(gate.update(null, 1000)).toBeNull();
    expect(gate.update(a, 1001)).toBeNull();
    expect(gate.update(a, 1111)).toBe(a);
  });
  it('resets the stability timer when pitch changes and supports explicit reset', () => {
    const gate = createNoteGate({ stableNoteMs: 20 });
    expect(gate.update(a, 0)).toBeNull();
    expect(gate.update(b, 10)).toBeNull();
    expect(gate.update(b, 29)).toBeNull();
    expect(gate.update(b, 30)).toBe(b);
    gate.reset();
    expect(gate.update(b, 40)).toBeNull();
    expect(gate.update(b, 60)).toBe(b);
  });
});
