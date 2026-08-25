import { getNoteName } from "../../shared/constants";
import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { loadPersisted, savePersisted } from "../../shared/persist";
import type { DetectedNote } from "../note-detection/noteMapper";
import { pickMelody, type Melody, type MelodyDifficulty } from "./catalog";
import {
  degreesFromFirstNote, evaluateDegreeGuess, type ManualAnswerBasis, sanitizeDegreeInput,
} from "./manualGuess";
import { intervalLabel, createMelodyMatcher, type MelodyMatcher, type MatchResult } from "./matcher";
import { createNoteGate, type NoteGate } from "./noteGate";
import { melodiesPanelHtml } from "./panel";
import { createMelodyPlayer } from "./playback";
import { melodyResultHtml } from "./result";
import {
  accidentalName, accidentalPrefix, accidentalSymbol, type Accidental, formatDegree, formatTime,
  setDisabled, setHidden, setPressed, setText,
} from "./ui";

type RoundStatus = "ready" | "guessing" | "complete" | "revealed";
type GuessMethod = "microphone" | "manual";

interface RoundState {
  melody: Melody;
  matcher: MelodyMatcher;
  gate: NoteGate;
  status: RoundStatus;
  elapsedMs: number;
  startedAt: number;
  round: number;
  previousMidi: number | null;
  method: GuessMethod;
  difficulty: MelodyDifficulty;
  micMatchedNotes: number;
  manualInput: readonly string[];
  manualJudgement: readonly boolean[] | null;
  manualAnswerBasis: ManualAnswerBasis;
  hasPlayed: boolean;
  microphoneActive: boolean;
  playing: boolean;
}

const player = createMelodyPlayer();
const METHOD_STORAGE_KEY = "melodies-guess-method";
const DIFFICULTY_STORAGE_KEY = "melodies-difficulty";
const DIFFICULTY_HINTS: Record<MelodyDifficulty, string> = {
  easy: "Famous, memorable tunes.",
  medium: "Less familiar tunes with longer phrases.",
  hard: "Longer phrases mixing major, minor, and chromatic notes.",
};
let listener: AudioListenerHandle | null = null;
let timerFrame: number | null = null;
let state: RoundState;

function currentElapsed(): number {
  if (state.status !== "guessing") return state.elapsedMs;
  return state.elapsedMs + performance.now() - state.startedAt;
}

function drawTimer(): void {
  setText("melodiesTimer", formatTime(currentElapsed()));
  if (state.status === "guessing") timerFrame = requestAnimationFrame(drawTimer);
}

function stopTimer(): void {
  if (timerFrame !== null) cancelAnimationFrame(timerFrame);
  timerFrame = null;
  if (state.status === "guessing") state.elapsedMs = currentElapsed();
  setText("melodiesTimer", formatTime(state.elapsedMs));
}

function startTimer(): void {
  state.startedAt = performance.now();
  drawTimer();
}

function updateAccidentalButtons(disabled: boolean): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(".melodies-accidental-btn")) {
    button.disabled = disabled;
  }
}

function updateButtons(): void {
  const finished = state.status === "complete" || state.status === "revealed";
  setText("melodiesGuessBtn", state.microphoneActive ? "Stop microphone" : "Start microphone");
  setDisabled("melodiesGuessBtn", finished || !state.hasPlayed);
  setDisabled("melodiesPlayBtn", state.playing || finished);
  setDisabled("melodiesRevealBtn", finished);
  setDisabled("melodiesMicMethodBtn", finished);
  setDisabled("melodiesManualMethodBtn", finished);
  setDisabled(
    "melodiesCheckBtn",
    finished || !state.hasPlayed || state.manualInput.length !== state.melody.degrees.length,
  );
  setDisabled("melodiesIntervalInput", finished || !state.hasPlayed);
  setDisabled("melodiesKeyInput", finished || !state.hasPlayed);
  setHidden("melodiesGuessBtn", state.method === "manual");
  updateAccidentalButtons(finished || !state.hasPlayed);
}

function renderProgress(matched = 0, label = "notes"): void {
  const total = state.melody.degrees.length;
  const progress = total === 0 ? 0 : (matched / total) * 100;
  const bar = document.getElementById("melodiesProgressBar");
  if (bar) bar.style.width = `${progress}%`;
  setText("melodiesProgressText", `${matched} of ${total} ${label}`);
}

function noteLabel(note: DetectedNote): string {
  const octave = Math.floor(note.midiNote / 12) - 1;
  return `${getNoteName(note.noteIndex, "sharp")}${octave}`;
}

function updateDetectedNote(note: DetectedNote): void {
  setText("melodiesDetectedNote", noteLabel(note));
  if (state.previousMidi === null) {
    setText("melodiesDetectedInterval", "Starting note — this sets your key");
  } else {
    const interval = ((note.midiNote - state.previousMidi) % 12 + 12) % 12;
    setText("melodiesDetectedInterval", intervalLabel(interval));
  }
  state.previousMidi = note.midiNote;
}

function showResult(result: MatchResult, revealed: boolean): void {
  const container = document.getElementById("melodiesResult");
  if (!container) return;
  container.hidden = false;
  const keyGuess = (document.getElementById("melodiesKeyInput") as HTMLInputElement | null)?.value ?? "";
  container.innerHTML = melodyResultHtml({
    melody: state.melody,
    result,
    revealed,
    elapsedMs: state.elapsedMs,
    manual: state.method === "manual",
    answerBasis: state.manualAnswerBasis,
    keyGuess,
  });
}

function completeRound(result: MatchResult): void {
  stopTimer();
  state.status = "complete";
  listener?.stop();
  state.microphoneActive = false;
  setText("melodiesStatus", "You got it!");
  setText("melodiesHint", "The full interval pattern matched.");
  showResult(result, false);
  updateButtons();
}

function handleAcceptedNote(note: DetectedNote): void {
  updateDetectedNote(note);
  const result = state.matcher.add(note.midiNote);
  state.micMatchedNotes = result.matchedNotes;
  renderProgress(result.matchedNotes);
  setText(
    "melodiesStatus",
    result.matched ? `Matched ${result.matchedNotes} of ${result.totalNotes}` : "That note doesn’t match yet",
  );
  setText(
    "melodiesHint",
    result.matched
      ? `${result.attemptAccuracy}% note accuracy — keep following the phrase.`
      : `Try that note again · ${result.attemptAccuracy}% note accuracy so far.`,
  );
  if (result.complete) completeRound(result);
}

function handleNote(note: DetectedNote | null): void {
  if (state.status !== "guessing" || state.method !== "microphone" || !state.microphoneActive) return;
  const accepted = state.gate.update(note, performance.now());
  if (accepted) handleAcceptedNote(accepted);
}

function stopMicrophone(): void {
  listener?.stop();
  state.microphoneActive = false;
  state.gate.reset();
  setText("melodiesStatus", "Microphone stopped");
  setText("melodiesHint", "The round timer is still running.");
  updateButtons();
}

async function startGuessing(): Promise<void> {
  if (!listener || state.method !== "microphone" || !state.hasPlayed) return;
  setDisabled("melodiesGuessBtn", true);
  setText("melodiesStatus", "Opening microphone…");
  try {
    await listener.start();
    state.microphoneActive = true;
    state.gate.reset();
    setText("melodiesStatus", "Play the phrase back");
    setText("melodiesHint", "Single notes work best. Pauses separate repeated notes.");
  } catch {
    setText("melodiesStatus", "Microphone access is needed");
    setText("melodiesHint", "Allow microphone access in your browser, then try again.");
  }
  updateButtons();
}

function toggleGuessing(): void {
  if (state.microphoneActive) stopMicrophone();
  else void startGuessing();
}

function renderManualBoxes(): void {
  const container = document.getElementById("melodiesIntervalBoxes");
  if (!container) return;
  container.innerHTML = state.melody.degrees
    .map((_, index) => {
      const degree = state.manualInput[index] ?? "";
      const judgement = state.manualJudgement?.[index];
      const classes = ["melodies-interval-box"];
      if (degree.length > 0) classes.push("filled");
      if (judgement === true) classes.push("correct");
      if (judgement === false) classes.push("incorrect");
      const accidental = accidentalSymbol(degree);
      const disabled = degree.length === 0 || state.status === "complete" || state.status === "revealed";
      const label = `Interval ${index + 1} is ${accidentalName(degree)}; change accidental`;
      return `<span class="melodies-interval-slot"><span class="${classes.join(" ")}">${formatDegree(degree)}</span><button type="button" class="melodies-accidental-btn" data-index="${index}" aria-label="${label}" ${disabled ? "disabled" : ""}>${accidental}</button></span>`;
    })
    .join("");
}

function beginManualGuessing(): void {
  if (!state.hasPlayed || state.status !== "guessing") return;
  setText("melodiesStatus", "Enter the interval pattern");
  setText("melodiesHint", "Use original-key degrees, or make the first note 1. The key guess is optional.");
  updateButtons();
}

function updateManualInput(field: HTMLInputElement): void {
  const digits = sanitizeDegreeInput(field.value, state.melody.degrees.length);
  field.value = digits;
  if (digits.length > 0) beginManualGuessing();
  const degrees = [...digits].map((digit, index) => {
    const existing = state.manualInput[index] ?? "";
    return `${accidentalPrefix(existing)}${digit}`;
  });
  state.manualInput = degrees;
  state.manualJudgement = null;
  state.manualAnswerBasis = null;
  renderManualBoxes();
  renderProgress(degrees.length, "entered");
  setText("melodiesStatus", `${degrees.length} of ${state.melody.degrees.length} intervals entered`);
  updateButtons();
}

function matchResultForManual(accuracy: number, complete: boolean, correctCount: number): MatchResult {
  return {
    matched: complete,
    complete,
    matchedNotes: correctCount,
    totalNotes: state.melody.degrees.length,
    attemptAccuracy: accuracy,
    expectedInterval: 0,
    playedInterval: 0,
  };
}

function checkManualGuess(): void {
  if (state.manualInput.length !== state.melody.degrees.length) return;
  const firstNotePattern = degreesFromFirstNote(state.melody.notes.map(({ midi }) => midi));
  const result = evaluateDegreeGuess(state.manualInput, state.melody.degrees, firstNotePattern);
  state.manualJudgement = result.correctPositions;
  state.manualAnswerBasis = result.answerBasis;
  renderManualBoxes();
  renderProgress(result.correctCount, "intervals");
  if (result.complete) {
    completeRound(matchResultForManual(result.accuracy, true, result.correctCount));
    return;
  }
  setText("melodiesStatus", `${result.correctCount} of ${state.melody.degrees.length} intervals are right`);
  setText("melodiesHint", "Highlighted boxes need another listen. Backspace and try again.");
}

function nextAccidental(degree: string): Accidental {
  if (degree.startsWith("b")) return "#";
  if (degree.startsWith("#")) return "";
  return "b";
}

function cycleAccidental(index: number): void {
  const degree = state.manualInput[index];
  if (!degree) return;
  const digit = degree.charAt(degree.length - 1);
  const degrees = [...state.manualInput];
  degrees[index] = `${nextAccidental(degree)}${digit}`;
  state.manualInput = degrees;
  state.manualJudgement = null;
  state.manualAnswerBasis = null;
  renderManualBoxes();
  renderProgress(degrees.length, "entered");
  setText("melodiesStatus", `Interval ${index + 1} changed to ${formatDegree(degrees[index])}`);
  setText("melodiesHint", "Each small button cycles through natural, flat, and sharp.");
  updateButtons();
}

function handleIntervalEntryClick(event: MouseEvent): void {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".melodies-accidental-btn");
  if (!button) {
    focusIntervalInput();
    return;
  }
  const index = Number(button.dataset.index);
  if (!Number.isNaN(index)) cycleAccidental(index);
}

function updateMethodUi(): void {
  const manual = state.method === "manual";
  setHidden("melodiesMicrophonePanel", manual);
  setHidden("melodiesManualPanel", !manual);
  setPressed("melodiesMicMethodBtn", !manual);
  setPressed("melodiesManualMethodBtn", manual);
  if (manual) {
    renderManualBoxes();
    renderProgress(state.manualInput.length, "entered");
  } else {
    renderProgress(state.micMatchedNotes);
  }
  updateButtons();
}

function updateDifficultyUi(): void {
  setPressed("melodiesEasyBtn", state.difficulty === "easy");
  setPressed("melodiesMediumBtn", state.difficulty === "medium");
  setPressed("melodiesHardBtn", state.difficulty === "hard");
  setText("melodiesDifficultyHint", DIFFICULTY_HINTS[state.difficulty]);
}

function selectMethod(method: GuessMethod): void {
  if (state.status === "complete" || state.status === "revealed" || state.method === method) return;
  if (state.microphoneActive) stopMicrophone();
  state.method = method;
  savePersisted(METHOD_STORAGE_KEY, method);
  setText("melodiesStatus", method === "manual" ? "Type the melody as scale degrees" : "Play the phrase back");
  setText(
    "melodiesHint",
    method === "manual"
      ? "Tap the boxes to open the numeric keyboard. The first heard note may be entered as 1."
      : "The first note can be anywhere that feels comfortable.",
  );
  updateMethodUi();
}

function selectDifficulty(difficulty: MelodyDifficulty): void {
  if (state.difficulty === difficulty) return;
  stopActiveRound();
  savePersisted(DIFFICULTY_STORAGE_KEY, difficulty);
  state = createRound(pickMelody(difficulty), state.round + 1, state.method, difficulty);
  resetRoundUi();
}

function focusIntervalInput(): void {
  const field = document.getElementById("melodiesIntervalInput") as HTMLInputElement | null;
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
}

async function playCurrentMelody(): Promise<void> {
  if (state.playing) return;
  const round = state.round;
  if (state.status === "ready") {
    state.status = "guessing";
    state.hasPlayed = true;
    startTimer();
  }
  state.playing = true;
  setText("melodiesStatus", "Listen carefully…");
  setText("melodiesHint", "The round timer is now running.");
  setText("melodiesPlayBtn", "♪ Playing…");
  updateButtons();
  await player.play(state.melody);
  if (state.round !== round) return;
  state.playing = false;
  setText("melodiesPlayBtn", "↻ Hear again");
  setText("melodiesStatus", state.method === "manual" ? "Enter the interval pattern" : "Now play it back");
  setText(
    "melodiesHint",
    state.method === "manual"
      ? "Use original-key degrees, or make the first note 1. The key guess is optional."
      : "Start the microphone when ready.",
  );
  updateButtons();
}

function stopRoundMedia(): void {
  if (state.microphoneActive) stopMicrophone();
  state.playing = false;
  player.stop();
}

function stopActiveRound(): void {
  if (state.status === "guessing") stopTimer();
  stopRoundMedia();
}

function createRound(
  melody: Melody,
  round: number,
  method: GuessMethod,
  difficulty: MelodyDifficulty,
): RoundState {
  return {
    melody,
    matcher: createMelodyMatcher(melody.notes.map(({ midi }) => midi)),
    gate: createNoteGate(),
    status: "ready",
    elapsedMs: 0,
    startedAt: 0,
    round,
    previousMidi: null,
    method,
    difficulty,
    micMatchedNotes: 0,
    manualInput: [],
    manualJudgement: null,
    manualAnswerBasis: null,
    hasPlayed: false,
    microphoneActive: false,
    playing: false,
  };
}

function resetRoundUi(): void {
  const difficultyLabel = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
  setText("melodiesRoundLabel", `${difficultyLabel} · Mystery melody · Round ${state.round}`);
  setText("melodiesTimer", "0:00.0");
  setText(
    "melodiesStatus",
    state.method === "manual" ? "Listen first, then enter the intervals" : "Listen first, then play it back",
  );
  setText("melodiesHint", "The timer starts when melody playback begins.");
  setText("melodiesDetectedNote", "—");
  setText("melodiesDetectedInterval", "Waiting for your guitar");
  setText("melodiesPlayBtn", "▶ Hear melody");
  const intervalInput = document.getElementById("melodiesIntervalInput") as HTMLInputElement | null;
  if (intervalInput) {
    intervalInput.value = "";
    intervalInput.maxLength = state.melody.degrees.length;
  }
  const keyInput = document.getElementById("melodiesKeyInput") as HTMLInputElement | null;
  if (keyInput) keyInput.value = "";
  const result = document.getElementById("melodiesResult");
  if (result) result.hidden = true;
  updateDifficultyUi();
  updateMethodUi();
}

function newRound(): void {
  stopActiveRound();
  state = createRound(
    pickMelody(state.difficulty, state.melody.id),
    state.round + 1,
    state.method,
    state.difficulty,
  );
  resetRoundUi();
}

function revealAnswer(): void {
  stopActiveRound();
  state.status = "revealed";
  const result: MatchResult = {
    matched: false,
    complete: false,
    matchedNotes: 0,
    totalNotes: state.melody.notes.length,
    attemptAccuracy: 0,
    expectedInterval: 0,
    playedInterval: 0,
  };
  setText("melodiesStatus", "Melody revealed");
  setText("melodiesHint", "Listen once more and notice the interval shape.");
  showResult(result, true);
  updateButtons();
}

function setupRoundEvents(): void {
  document.getElementById("melodiesPlayBtn")?.addEventListener("click", () => void playCurrentMelody());
  document.getElementById("melodiesGuessBtn")?.addEventListener("click", toggleGuessing);
  document.getElementById("melodiesRevealBtn")?.addEventListener("click", revealAnswer);
  document.getElementById("melodiesNewBtn")?.addEventListener("click", newRound);
}

function setupMethodEvents(): void {
  document.getElementById("melodiesMicMethodBtn")?.addEventListener("click", () => selectMethod("microphone"));
  document.getElementById("melodiesManualMethodBtn")?.addEventListener("click", () => selectMethod("manual"));
}

function setupDifficultyEvents(): void {
  document.getElementById("melodiesEasyBtn")?.addEventListener("click", () => selectDifficulty("easy"));
  document.getElementById("melodiesMediumBtn")?.addEventListener("click", () => selectDifficulty("medium"));
  document.getElementById("melodiesHardBtn")?.addEventListener("click", () => selectDifficulty("hard"));
}

function setupManualEvents(): void {
  document.getElementById("melodiesIntervalEntry")?.addEventListener("click", handleIntervalEntryClick);
  document.getElementById("melodiesIntervalInput")?.addEventListener("input", (event) => {
    updateManualInput(event.target as HTMLInputElement);
  });
  document.getElementById("melodiesKeyInput")?.addEventListener("input", (event) => {
    if ((event.target as HTMLInputElement).value.length > 0) beginManualGuessing();
  });
  document.getElementById("melodiesCheckBtn")?.addEventListener("click", checkManualGuess);
}

function setupEvents(): void {
  setupRoundEvents();
  setupMethodEvents();
  setupDifficultyEvents();
  setupManualEvents();
  window.addEventListener("hashchange", () => {
    if (window.location.hash.slice(1) !== "melodies") stopRoundMedia();
  });
}

function loadGuessMethod(): GuessMethod {
  const method = loadPersisted<GuessMethod>(METHOD_STORAGE_KEY, "microphone");
  return method === "manual" ? "manual" : "microphone";
}

function loadDifficulty(): MelodyDifficulty {
  const difficulty = loadPersisted<MelodyDifficulty>(DIFFICULTY_STORAGE_KEY, "easy");
  if (difficulty === "medium" || difficulty === "hard") return difficulty;
  return "easy";
}

export function initMelodiesFeature(): void {
  const container = document.getElementById("melodies-page");
  if (!container) return;
  container.innerHTML = melodiesPanelHtml();
  const difficulty = loadDifficulty();
  state = createRound(pickMelody(difficulty), 1, loadGuessMethod(), difficulty);
  listener = createAudioListener({ onNote: handleNote });
  setupEvents();
  resetRoundUi();
}
