export interface ManualGuessResult {
  correctPositions: readonly boolean[];
  correctCount: number;
  complete: boolean;
  accuracy: number;
  answerBasis: ManualAnswerBasis;
}

export type ManualAnswerBasis = "original-key" | "first-note" | null;

const CHROMATIC_DEGREES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"] as const;

export function sanitizeDegreeInput(value: string, maximumLength: number): string {
  return [...value].filter((character) => character >= "1" && character <= "7").join("").slice(0, maximumLength);
}

function judgePattern(value: readonly string[], expected: readonly string[]): Omit<ManualGuessResult, "answerBasis"> {
  const correctPositions = expected.map((degree, index) => value[index] === degree);
  const correctCount = correctPositions.filter(Boolean).length;
  const accuracy = expected.length === 0 ? 0 : Math.round((correctCount / expected.length) * 100);
  return {
    correctPositions,
    correctCount,
    complete: value.length === expected.length && correctCount === expected.length,
    accuracy,
  };
}

export function degreesFromFirstNote(midis: readonly number[]): readonly string[] {
  if (midis.length === 0) return [];
  const firstMidi = midis[0];
  return midis.map((midi) => {
    const semitones = ((midi - firstMidi) % 12 + 12) % 12;
    return CHROMATIC_DEGREES[semitones];
  });
}

export function evaluateDegreeGuess(
  value: readonly string[],
  originalKeyPattern: readonly string[],
  firstNotePattern: readonly string[],
): ManualGuessResult {
  const originalResult = judgePattern(value, originalKeyPattern);
  const firstNoteResult = judgePattern(value, firstNotePattern);
  const bestResult = firstNoteResult.correctCount > originalResult.correctCount ? firstNoteResult : originalResult;
  let answerBasis: ManualAnswerBasis = null;
  if (originalResult.complete) answerBasis = "original-key";
  else if (firstNoteResult.complete) answerBasis = "first-note";
  return { ...bestResult, complete: answerBasis !== null, answerBasis };
}

function normalizeKey(value: string): string {
  const compact = value.toLowerCase().replace(/♯/g, "#").replace(/♭/g, "b").replace(/[^#a-z]/g, "");
  if (/^[a-g][#b]?m$/.test(compact)) return `${compact.slice(0, -1)}minor`;
  if (compact.endsWith("maj")) return `${compact.slice(0, -3)}major`;
  if (compact.endsWith("min")) return `${compact.slice(0, -3)}minor`;
  return compact;
}

/** An optional tonic-only answer is accepted; a supplied mode must also match. */
export function isKeyGuessCorrect(guess: string, expected: string): boolean | null {
  const normalizedGuess = normalizeKey(guess);
  if (normalizedGuess.length === 0) return null;
  const normalizedExpected = normalizeKey(expected);
  const tonic = /^[a-g][#b]?/.exec(normalizedExpected)?.[0] ?? normalizedExpected;
  if (normalizedGuess === tonic) return true;
  const expandedGuess = normalizedGuess.replace("maj", "major").replace("min", "minor");
  return expandedGuess === normalizedExpected;
}
