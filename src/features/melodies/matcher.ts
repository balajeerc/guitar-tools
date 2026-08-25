const SEMITONES_PER_OCTAVE = 12;

export interface MatchResult {
  matched: boolean;
  complete: boolean;
  matchedNotes: number;
  totalNotes: number;
  attemptAccuracy: number;
  expectedInterval: number;
  playedInterval: number;
}

export interface MelodyMatcher {
  add: (midi: number) => MatchResult;
  reset: () => void;
}

function pitchClassInterval(midi: number, anchor: number): number {
  return ((midi - anchor) % SEMITONES_PER_OCTAVE + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

export function intervalLabel(interval: number): string {
  if (interval === 0) return "same note";
  if (interval <= 6) return `up ${interval} semitone${interval === 1 ? "" : "s"}`;
  const descending = SEMITONES_PER_OCTAVE - interval;
  return `down ${descending} semitone${descending === 1 ? "" : "s"}`;
}

export function createMelodyMatcher(expectedMidi: readonly number[]): MelodyMatcher {
  let playedAnchor: number | null = null;
  let matchedNotes = 0;
  let attempts = 0;
  let correctAttempts = 0;
  const expectedAnchor = expectedMidi[0] ?? 0;

  function add(midi: number): MatchResult {
    playedAnchor ??= midi;
    const expected = expectedMidi[matchedNotes] ?? expectedAnchor;
    const expectedInterval = pitchClassInterval(expected, expectedAnchor);
    const playedInterval = pitchClassInterval(midi, playedAnchor);
    const matched = expectedInterval === playedInterval;
    attempts += 1;
    if (matched) {
      matchedNotes += 1;
      correctAttempts += 1;
    }
    return {
      matched,
      complete: matchedNotes === expectedMidi.length,
      matchedNotes,
      totalNotes: expectedMidi.length,
      attemptAccuracy: Math.round((correctAttempts / attempts) * 100),
      expectedInterval,
      playedInterval,
    };
  }

  function reset(): void {
    playedAnchor = null;
    matchedNotes = 0;
    attempts = 0;
    correctAttempts = 0;
  }

  return { add, reset };
}
