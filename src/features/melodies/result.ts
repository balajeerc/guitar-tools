import type { Melody } from "./catalog";
import { isKeyGuessCorrect, type ManualAnswerBasis } from "./manualGuess";
import type { MatchResult } from "./matcher";
import { formatTime, intervalAnswerHtml } from "./ui";

interface MelodyResultOptions {
  melody: Melody;
  result: MatchResult;
  revealed: boolean;
  elapsedMs: number;
  manual: boolean;
  answerBasis: ManualAnswerBasis;
  keyGuess: string;
}

function calculateScore(result: MatchResult, elapsedMs: number): number {
  const timeFactor = 1 / (1 + elapsedMs / 30_000);
  return Math.round(1000 * (result.attemptAccuracy / 100) * timeFactor);
}

function resultDetails(options: MelodyResultOptions): string {
  if (options.revealed) return "Answer revealed — try another when you’re ready.";
  const accuracyLabel = options.manual ? "interval accuracy" : "note accuracy";
  const score = calculateScore(options.result, options.elapsedMs);
  let details = `${formatTime(options.elapsedMs)} · ${options.result.attemptAccuracy}% ${accuracyLabel} · ${score} points`;
  const keyCorrect = isKeyGuessCorrect(options.keyGuess, options.melody.key);
  if (keyCorrect === null) return details;
  details += keyCorrect ? ` · Key: ${options.melody.key} ✓` : ` · Key was ${options.melody.key}`;
  return details;
}

export function melodyResultHtml(options: MelodyResultOptions): string {
  const { melody, answerBasis } = options;
  const firstNoteAccepted = answerBasis === "first-note";
  const caveat = firstNoteAccepted
    ? '<p class="melodies-answer-caveat"><b>Accepted:</b> you treated the first heard note as 1.</p>'
    : "";
  const answerLabel = firstNoteAccepted ? `In the original key (${melody.key})` : "Correct intervals";
  const answer = intervalAnswerHtml(melody.degrees, answerLabel);
  return `<strong>${melody.title}</strong><span>${melody.attribution} · ${melody.key}</span>${caveat}${answer}<small>${resultDetails(options)}</small>`;
}
