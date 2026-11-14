import { createResetLink } from '../../shared/resetLink';
import { sanitizeDegreeInput } from '../melodies/manualGuess';
import { createMelodyPlayer } from '../melodies/playback';
import { MELODY_TONES, type MelodyTone } from '../melodies/tone';
import { accidentalPrefix, formatDegree, nextDegreeAccidental, setText } from '../melodies/ui';

import { setupCheatsheet } from './cheatsheet';
import { earTrainerPanelHtml } from './panel';
import {
  loadPractice,
  recordAttempt,
  resetTodaySession,
  savePractice,
  takeReview,
} from './practice';
import { renderSession } from './sessionView';
import { loadEarTrainerSettings, saveEarTrainerSettings } from './settings';
import {
  clampInteger,
  createExercise,
  DEFAULT_EAR_TRAINER_SETTINGS,
  degreeSemitones,
  type EarTrainerDirection,
  type EarTrainerExercise,
  type EarTrainerSettings,
  exerciseDegrees,
  MAX_NOTE_COUNT,
  MAX_OCTAVE,
  MIN_NOTE_COUNT,
  MIN_OCTAVE,
  normalizeSettings,
} from './theory';
import {
  renderAnswerInputs,
  renderExercise,
  renderResult,
  renderSettings,
  updateRoundButtons,
} from './view';

import type { Melody } from '../melodies/catalog';

type RoundStatus = 'correct' | 'ready' | 'revealed';

interface RoundState {
  degrees: string[];
  exercise: EarTrainerExercise;
  hasPlayed: boolean;
  judgement: boolean[] | null;
  playing: boolean;
  recorded: boolean;
  status: RoundStatus;
}

const INITIAL_STATUS = 'Press play to listen';
const INITIAL_HINT = 'Enter each note as a scale degree of the key.';
const EXERCISE_BPM = 90;
const player = createMelodyPlayer();

let settings: EarTrainerSettings = { ...DEFAULT_EAR_TRAINER_SETTINGS };
let round: RoundState = createRound(createExercise(settings), settings.playRootFirst);
let playbackId = 0;
let practice = loadPractice();

function getInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function createRound(exercise: EarTrainerExercise, prefillFirst: boolean): RoundState {
  const degrees = exercise.notes.map((_, index) => (index === 0 && prefillFirst ? '1' : ''));
  return {
    exercise,
    degrees,
    judgement: null,
    status: 'ready',
    hasPlayed: false,
    playing: false,
    recorded: false,
  };
}

function asMelody(exercise: EarTrainerExercise): Melody {
  return {
    id: 'ear-trainer',
    title: 'Scale degree exercise',
    attribution: '',
    key: '',
    difficulty: 'easy',
    bpm: EXERCISE_BPM,
    notes: exercise.notes.map((midi) => ({ midi, beats: 1 })),
    degrees: [],
  };
}

function isFinished(): boolean {
  return round.status !== 'ready';
}

function answersComplete(): boolean {
  return round.degrees.every((degree) => degree.length > 0);
}

function renderAnswers(disabled = false): void {
  renderAnswerInputs(round.exercise.notes.length, round.degrees, round.judgement, disabled);
}

function stopPlayback(): void {
  playbackId += 1;
  player.stop();
  round.playing = false;
}

function updateButtons(): void {
  updateRoundButtons({
    playing: round.playing,
    hasPlayed: round.hasPlayed,
    finished: isFinished(),
    revealed: round.status === 'revealed',
    selectionsComplete: answersComplete(),
  });
}

function newExercise(): void {
  stopPlayback();
  const review = takeReview(practice, settings);
  round = createRound(review ?? createExercise(settings), settings.playRootFirst);
  savePractice(practice);
  renderSettings(settings);
  renderExercise(
    round.exercise,
    settings,
    INITIAL_STATUS,
    review ? 'A phrase to revisit. Listen and try again from memory.' : INITIAL_HINT
  );
  renderSession(practice, settings.repeatMistakes);
  renderAnswers();
  updateButtons();
}

function updateSettings(update: Partial<EarTrainerSettings>): void {
  settings = normalizeSettings({ ...settings, ...update });
  saveEarTrainerSettings(settings);
  newExercise();
}

async function playExercise(): Promise<void> {
  if (round.playing) return;
  const currentPlayback = ++playbackId;
  round.playing = true;
  round.hasPlayed = true;
  setText('earTrainerStatus', 'Listen carefully…');
  setText('earTrainerHint', 'Enter each note as a scale degree of the key.');
  updateButtons();
  try {
    await player.play(asMelody(round.exercise), settings.tone);
  } finally {
    if (currentPlayback === playbackId) {
      round.playing = false;
      setText('earTrainerStatus', 'Which degrees did you hear?');
      setText('earTrainerHint', 'Enter each note, then use the small buttons to add ♭ or ♯.');
      updateButtons();
    }
  }
}

function finishRound(status: 'correct' | 'revealed'): void {
  stopPlayback();
  round.status = status;
  round.degrees = [...exerciseDegrees(round.exercise)];
  round.judgement = round.exercise.notes.map(() => true);
  renderAnswers(true);
  const correct = status === 'correct';
  setText('earTrainerStatus', correct ? 'You got it!' : 'Answer revealed');
  setText(
    'earTrainerHint',
    correct ? 'Every scale degree matched.' : 'Listen once more and notice the note degrees.'
  );
  renderResult(
    round.exercise,
    correct ? 'You got it!' : 'Answer revealed',
    correct ? 'Every note matched.' : 'Listen again and notice the scale degrees.'
  );
  updateButtons();
}

function advanceExercise(): void {
  newExercise();
  document.getElementById('earTrainerPlayBtn')?.focus();
}

function checkAnswer(): void {
  if (isFinished()) {
    advanceExercise();
    return;
  }
  if (round.playing || !round.hasPlayed) return;
  if (!answersComplete()) {
    setText('earTrainerStatus', 'Enter every note first');
    setText('earTrainerHint', 'Type one scale degree for each note.');
    return;
  }
  const expected = exerciseDegrees(round.exercise);
  const judgement = expected.map((degree, index) => {
    const actual = round.degrees[index];
    if (!actual) return false;
    return degreeSemitones(actual) === degreeSemitones(degree);
  });
  const correctCount = judgement.filter(Boolean).length;
  recordFirstAttempt(judgement);
  round.judgement = judgement;
  if (correctCount === expected.length) {
    finishRound('correct');
    return;
  }
  renderAnswers();
  setText('earTrainerStatus', `${correctCount} of ${expected.length} notes correct`);
  setText('earTrainerHint', 'Highlighted notes need another listen. Change them and check again.');
  updateButtons();
}

function revealAnswer(): void {
  if (isFinished()) return;
  recordFirstAttempt(round.exercise.notes.map(() => false));
  finishRound('revealed');
}

function recordFirstAttempt(judgement: readonly boolean[]): void {
  if (round.recorded || !settings.repeatMistakes) return;
  round.recorded = true;
  recordAttempt(practice, round.exercise, settings, judgement);
  savePractice(practice);
  renderSession(practice, true);
}

function updateAnswerInput(field: HTMLInputElement): void {
  const count = round.exercise.notes.length;
  const caret = field.selectionStart ?? field.value.length;
  const digits = sanitizeDegreeInput(field.value, count);
  field.value = digits;
  const nextCaret = Math.min(caret, digits.length);
  field.setSelectionRange(nextCaret, nextCaret);
  round.degrees = Array.from({ length: count }, (_, index) => {
    const digit = digits.charAt(index);
    if (digit === '') return '';
    const existing = round.degrees[index] ?? '';
    return `${accidentalPrefix(existing)}${digit}`;
  });
  round.judgement = null;
  renderAnswers();
  const entered = round.degrees.filter((degree) => degree.length > 0).length;
  setText('earTrainerStatus', `${entered} of ${count} notes entered`);
  setText('earTrainerHint', 'Tap the small button under a box to cycle ♭, natural and ♯.');
  updateButtons();
}

function cycleAccidental(index: number): void {
  const degree = round.degrees[index];
  if (!degree || isFinished()) return;
  round.degrees[index] = `${nextDegreeAccidental(degree)}${degree.charAt(degree.length - 1)}`;
  round.judgement = null;
  renderAnswers();
  setText('earTrainerStatus', `Note ${index + 1} changed to ${formatDegree(round.degrees[index])}`);
  setText('earTrainerHint', 'Continue with the remaining notes, then check your answer.');
  updateButtons();
}

function focusDegreeInput(position?: number): void {
  const field = getInput('earTrainerDegreeInput');
  if (!field) return;
  field.focus();
  const length = field.value.length;
  const start = position === undefined ? length : Math.min(position, length);
  const end = start < length ? start + 1 : start;
  field.setSelectionRange(start, end);
}

function intervalSlotIndex(target: HTMLElement): number {
  const slot = target.closest<HTMLElement>('.melodies-interval-slot');
  if (!slot?.parentElement) return -1;
  return [...slot.parentElement.children].indexOf(slot);
}

function handleIntervalEntryClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLButtonElement>('[data-ear-trainer-accidental]');
  if (button) {
    const index = Number(button.dataset.earTrainerAccidental);
    if (!Number.isNaN(index)) cycleAccidental(index);
    return;
  }
  const index = intervalSlotIndex(target);
  focusDegreeInput(index >= 0 ? index : undefined);
}

function commitOctaves(field: 'end' | 'start'): void {
  const startInput = getInput('earTrainerOctaveStart');
  const endInput = getInput('earTrainerOctaveEnd');
  if (!startInput || !endInput) return;
  let start = clampInteger(
    Number.parseInt(startInput.value, 10),
    MIN_OCTAVE,
    MAX_OCTAVE,
    settings.octaveStart
  );
  let end = clampInteger(
    Number.parseInt(endInput.value, 10),
    MIN_OCTAVE,
    MAX_OCTAVE,
    settings.octaveEnd
  );
  if (start > end) {
    if (field === 'start') end = start;
    else start = end;
  }
  startInput.value = String(start);
  endInput.value = String(end);
  updateSettings({ octaveStart: start, octaveEnd: end });
}

function changeNoteCount(delta: number): void {
  const noteCount = clampInteger(
    settings.noteCount + delta,
    MIN_NOTE_COUNT,
    MAX_NOTE_COUNT,
    settings.noteCount
  );
  if (noteCount !== settings.noteCount) updateSettings({ noteCount });
}

function changeKey(delta: number): void {
  updateSettings({ keyIndex: (settings.keyIndex + delta + 12) % 12 });
}

function updateDirection(direction: EarTrainerDirection, enabled: boolean): void {
  const directions = enabled
    ? [...new Set([...settings.directions, direction])]
    : settings.directions.filter((item) => item !== direction);
  if (directions.length === 0) {
    renderSettings(settings);
    return;
  }
  updateSettings({ directions });
}

function selectTone(tone: MelodyTone): void {
  settings = { ...settings, tone };
  saveEarTrainerSettings(settings);
  renderSettings(settings);
}

function resetSettings(): void {
  settings = { ...DEFAULT_EAR_TRAINER_SETTINGS };
  saveEarTrainerSettings(settings);
  newExercise();
}

function resetSessionProgress(): void {
  resetTodaySession(practice);
  savePractice(practice);
  renderSession(practice, settings.repeatMistakes);
}

function setupSessionEvents(): void {
  document
    .getElementById('earTrainerResetSessionBtn')
    ?.addEventListener('click', resetSessionProgress);
}

function setupToneEvents(): void {
  for (const { value } of MELODY_TONES) {
    document.getElementById(`earTrainerTone${value}Btn`)?.addEventListener('click', () => {
      selectTone(value);
    });
  }
}

function setupDirectionEvents(): void {
  getInput('earTrainerAscending')?.addEventListener('change', (event) => {
    updateDirection('ascending', (event.target as HTMLInputElement).checked);
  });
  getInput('earTrainerDescending')?.addEventListener('change', (event) => {
    updateDirection('descending', (event.target as HTMLInputElement).checked);
  });
}

function setupCheckboxSettingEvents(): void {
  const fields = {
    earTrainerPlayRootFirst: 'playRootFirst',
    earTrainerMajorMinorOnly: 'majorMinorOnly',
    earTrainerFixKey: 'fixedKey',
    earTrainerRepeatMistakes: 'repeatMistakes',
  } as const;
  for (const [id, field] of Object.entries(fields)) {
    getInput(id)?.addEventListener('change', (event) => {
      updateSettings({ [field]: (event.target as HTMLInputElement).checked });
    });
  }
}

function setupSettingEvents(): void {
  getInput('earTrainerOctaveStart')?.addEventListener('change', () => {
    commitOctaves('start');
  });
  getInput('earTrainerOctaveEnd')?.addEventListener('change', () => {
    commitOctaves('end');
  });
  document.getElementById('earTrainerNotesDown')?.addEventListener('click', () => {
    changeNoteCount(-1);
  });
  document.getElementById('earTrainerNotesUp')?.addEventListener('click', () => {
    changeNoteCount(1);
  });
  document.getElementById('earTrainerKeyPrev')?.addEventListener('click', () => {
    changeKey(-1);
  });
  document.getElementById('earTrainerKeyNext')?.addEventListener('click', () => {
    changeKey(1);
  });
  setupDirectionEvents();
  setupCheckboxSettingEvents();
  setupToneEvents();
}

function setupRoundEvents(): void {
  document
    .getElementById('earTrainerPlayBtn')
    ?.addEventListener('click', () => void playExercise());
  document.getElementById('earTrainerCheckBtn')?.addEventListener('click', checkAnswer);
  document.getElementById('earTrainerRevealBtn')?.addEventListener('click', revealAnswer);
  document.getElementById('earTrainerNewBtn')?.addEventListener('click', newExercise);
  document.getElementById('earTrainerNextBtn')?.addEventListener('click', advanceExercise);
  getInput('earTrainerDegreeInput')?.addEventListener('input', (event) => {
    updateAnswerInput(event.target as HTMLInputElement);
  });
  document
    .getElementById('earTrainerDegreeEntry')
    ?.addEventListener('click', handleIntervalEntryClick);
}

function pauseExercise(): void {
  const wasPlaying = round.playing;
  stopPlayback();
  if (!wasPlaying) return;
  setText('earTrainerStatus', 'Playback stopped');
  setText('earTrainerHint', 'Press play to hear the exercise again.');
  updateButtons();
}

function handleRouteStop(): void {
  if (window.location.hash.slice(1) !== 'ear-trainer') pauseExercise();
}

function setupRouteStop(): void {
  window.addEventListener('hashchange', handleRouteStop);
}

function setupSettingsDisclosure(): void {
  const details = document.getElementById('earTrainerSettings') as HTMLDetailsElement | null;
  if (!details) return;
  details.open = !window.matchMedia('(max-width: 767px)').matches;
}

export function initEarTrainerFeature(): void {
  const container = document.getElementById('ear-trainer-page');
  if (!container) return;
  container.innerHTML = earTrainerPanelHtml();
  setupSettingsDisclosure();
  settings = loadEarTrainerSettings();
  practice = loadPractice();
  round = createRound(createExercise(settings), settings.playRootFirst);
  document.getElementById('earTrainerReset')?.appendChild(createResetLink(resetSettings));
  newExercise();
  setupSettingEvents();
  setupRoundEvents();
  setupSessionEvents();
  setupRouteStop();
  setupCheatsheet({ getTone: () => settings.tone, onOpen: pauseExercise });
}
