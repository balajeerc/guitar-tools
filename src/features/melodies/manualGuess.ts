export interface ManualGuessResult {
  correctPositions: readonly boolean[];
  correctCount: number;
  complete: boolean;
  accuracy: number;
}

export function sanitizeDegreeInput(value: string, maximumLength: number): string {
  return [...value].filter((character) => character >= "1" && character <= "7").join("").slice(0, maximumLength);
}

export function evaluateDegreeGuess(value: readonly string[], expected: readonly string[]): ManualGuessResult {
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
