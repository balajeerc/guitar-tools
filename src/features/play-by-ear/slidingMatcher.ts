import type { MatchResult, MelodyMatcher } from "../melodies/matcher";

const SEMITONES_PER_OCTAVE = 12;

interface PrefixMatch {
  matchedNotes: number;
  playedAnchor: number;
}

function pitchClassInterval(midi: number, anchor: number): number {
  return ((midi - anchor) % SEMITONES_PER_OCTAVE + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

function matchesPrefix(
  recentNotes: readonly number[],
  expectedMidi: readonly number[],
  prefixLength: number,
): boolean {
  const playedAnchor = recentNotes[0];
  const expectedAnchor = expectedMidi[0];
  let playedIndex = 0;
  let expectedIndex = 0;

  while (playedIndex < recentNotes.length && expectedIndex < prefixLength) {
    const playedInterval = pitchClassInterval(recentNotes[playedIndex], playedAnchor);
    const expectedInterval = pitchClassInterval(expectedMidi[expectedIndex], expectedAnchor);
    if (playedInterval === expectedInterval) {
      playedIndex += 1;
      expectedIndex += 1;
      continue;
    }

    const repeatedExpectedNote =
      expectedIndex > 0 && expectedMidi[expectedIndex] === expectedMidi[expectedIndex - 1];
    if (!repeatedExpectedNote) return false;
    expectedIndex += 1;
  }

  return playedIndex === recentNotes.length && expectedIndex === prefixLength;
}

function findBestPrefix(recentNotes: readonly number[], expectedMidi: readonly number[]): PrefixMatch {
  for (let prefixLength = expectedMidi.length; prefixLength > 0; prefixLength -= 1) {
    for (let start = 0; start < recentNotes.length; start += 1) {
      const suffix = recentNotes.slice(start);
      if (suffix.length <= prefixLength && matchesPrefix(suffix, expectedMidi, prefixLength)) {
        return { matchedNotes: prefixLength, playedAnchor: suffix[0] };
      }
    }
  }
  return { matchedNotes: 0, playedAnchor: recentNotes[recentNotes.length - 1] ?? 0 };
}

/** Recognizes a melody shape anywhere in a rolling window, independent of its starting key. */
export function createSlidingMelodyMatcher(expectedMidi: readonly number[]): MelodyMatcher {
  const recentNotes: number[] = [];
  const expectedAnchor = expectedMidi[0] ?? 0;
  let matchedNotes = 0;
  let attempts = 0;
  let correctAttempts = 0;

  function add(midi: number): MatchResult {
    recentNotes.push(midi);
    if (recentNotes.length > expectedMidi.length) recentNotes.shift();

    const previousMatchedNotes = matchedNotes;
    const bestMatch = findBestPrefix(recentNotes, expectedMidi);
    matchedNotes = bestMatch.matchedNotes;
    const matched = matchedNotes > previousMatchedNotes;
    attempts += 1;
    if (matched) correctAttempts += 1;

    const expectedIndex = Math.max(0, Math.min(matchedNotes - 1, expectedMidi.length - 1));
    return {
      matched,
      complete: matchedNotes === expectedMidi.length,
      matchedNotes,
      totalNotes: expectedMidi.length,
      attemptAccuracy: Math.round((correctAttempts / attempts) * 100),
      expectedInterval: pitchClassInterval(expectedMidi[expectedIndex] ?? expectedAnchor, expectedAnchor),
      playedInterval: pitchClassInterval(midi, bestMatch.playedAnchor),
    };
  }

  function reset(): void {
    recentNotes.length = 0;
    matchedNotes = 0;
    attempts = 0;
    correctAttempts = 0;
  }

  return { add, reset };
}
