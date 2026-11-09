import { requiredAt } from '../../shared/requiredAt';
import { MELODY_TONES } from '../melodies/tone';
import {
  degreeBoxesHtml,
  intervalAnswerHtml,
  setDisabled,
  setHidden,
  setPressed,
  setText,
} from '../melodies/ui';

import {
  type EarTrainerExercise,
  type EarTrainerSettings,
  exerciseDegrees,
  intervalOption,
  keyName,
  midiNoteLabel,
} from './theory';

interface RoundButtonState {
  finished: boolean;
  hasPlayed: boolean;
  playing: boolean;
  selectionsComplete: boolean;
}

function inputById(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function setInputValue(id: string, value: number): void {
  const input = inputById(id);
  if (input) input.value = String(value);
}

function setChecked(id: string, checked: boolean): void {
  const input = inputById(id);
  if (input) input.checked = checked;
}

function directionHint(settings: EarTrainerSettings): string {
  const ascending = settings.directions.includes('ascending');
  const descending = settings.directions.includes('descending');
  if (ascending && descending) return 'Phrases may ascend or descend.';
  if (ascending) return 'Phrases only ascend.';
  return settings.playRootFirst
    ? 'The first jump is upward; any remaining notes only descend.'
    : 'Phrases only descend.';
}

function directionLabel(settings: EarTrainerSettings): string {
  const ascending = settings.directions.includes('ascending');
  const descending = settings.directions.includes('descending');
  if (ascending && descending) return 'Asc + desc';
  if (ascending) return 'Ascending';
  return settings.playRootFirst ? 'Up then down' : 'Descending';
}

function settingsHint(settings: EarTrainerSettings): string {
  const range = `Notes stay from the key's root in octave ${settings.octaveStart} through its root in octave ${settings.octaveEnd + 1}, inclusive.`;
  const start = settings.playRootFirst
    ? 'The first note is the lowest root, so its box starts at 1.'
    : 'The first note is random.';
  const key = settings.fixedKey
    ? `Key fixed to ${keyName(settings.keyIndex)}.`
    : 'Key changes each exercise.';
  return `${range} ${directionHint(settings)} ${start} ${key}`;
}

function roundLabel(settings: EarTrainerSettings, keyIndex: number): string {
  const range = `Oct ${settings.octaveStart}–${settings.octaveEnd}`;
  const key = `Key ${keyName(keyIndex)}`;
  const rootFirst = settings.playRootFirst ? ' · Root first' : '';
  return `${range} · ${key}${rootFirst} · ${directionLabel(settings)}`;
}

function noteCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function renderSettings(settings: EarTrainerSettings): void {
  setInputValue('earTrainerOctaveStart', settings.octaveStart);
  setInputValue('earTrainerOctaveEnd', settings.octaveEnd);
  setText('earTrainerNotesDisplay', String(settings.noteCount));
  setChecked('earTrainerAscending', settings.directions.includes('ascending'));
  setChecked('earTrainerDescending', settings.directions.includes('descending'));
  setChecked('earTrainerPlayRootFirst', settings.playRootFirst);
  setChecked('earTrainerFixKey', settings.fixedKey);
  setHidden('earTrainerKeyControl', !settings.fixedKey);
  setText('earTrainerKeyDisplay', keyName(settings.keyIndex));
  setText('earTrainerSettingsHint', settingsHint(settings));
  for (const option of MELODY_TONES) {
    setPressed(`earTrainerTone${option.value}Btn`, settings.tone === option.value);
  }
}

export function renderExercise(
  exercise: EarTrainerExercise,
  settings: EarTrainerSettings,
  status: string,
  hint: string
): void {
  setText('earTrainerRoundLabel', roundLabel(settings, exercise.keyIndex));
  setText(
    'earTrainerRoundDetail',
    `${noteCountLabel(exercise.notes.length, 'note', 'notes')} · ${noteCountLabel(exercise.intervals.length, 'interval', 'intervals')}`
  );
  setText('earTrainerStatus', status);
  setText('earTrainerHint', hint);
  const result = document.getElementById('earTrainerResult');
  if (result) {
    result.hidden = true;
    result.innerHTML = '';
  }
}

export function renderAnswerInputs(
  expectedLength: number,
  degrees: readonly string[],
  judgement: null | readonly boolean[],
  disabled: boolean
): void {
  const boxes = document.getElementById('earTrainerDegreeBoxes');
  if (boxes) {
    boxes.innerHTML = degreeBoxesHtml({
      expectedLength,
      values: degrees,
      judgement,
      disabled,
      idPrefix: 'ear-trainer',
    });
  }
  const input = inputById('earTrainerDegreeInput');
  if (!input) return;
  const digits = degrees.map((degree) => (degree ? degree.charAt(degree.length - 1) : '')).join('');
  if (input.value !== digits) input.value = digits;
  input.maxLength = expectedLength;
  input.disabled = disabled;
}

function noteChain(exercise: EarTrainerExercise): string {
  return exercise.notes
    .map((midi, index) => {
      if (index === 0) return midiNoteLabel(midi);
      const direction = midi > requiredAt(exercise.notes, index - 1) ? '↑' : '↓';
      return `${direction} ${midiNoteLabel(midi)}`;
    })
    .join(' ');
}

export function renderResult(exercise: EarTrainerExercise, heading: string, detail: string): void {
  const container = document.getElementById('earTrainerResult');
  if (!container) return;
  const notes = noteChain(exercise);
  const degrees = exerciseDegrees(exercise);
  const labels = exercise.intervals.map(
    (semitones) => intervalOption(semitones)?.short ?? String(semitones)
  );
  const root =
    exercise.rootMidi === null
      ? `Key ${keyName(exercise.keyIndex)} · started on ${midiNoteLabel(requiredAt(exercise.notes, 0))}.`
      : `Key ${keyName(exercise.keyIndex)} · root ${midiNoteLabel(exercise.rootMidi)}.`;
  container.innerHTML = `<strong>${heading}</strong><span>${notes}</span>${intervalAnswerHtml(degrees, 'Scale degrees')}${intervalAnswerHtml(labels, 'Intervals')}<small>${detail} ${root} Direction is not scored.</small>`;
  container.hidden = false;
}

export function updateRoundButtons(state: RoundButtonState): void {
  setText('earTrainerPlayBtn', state.playing ? '♪ Playing…' : '▶ Play notes');
  setDisabled('earTrainerPlayBtn', state.playing);
  setDisabled(
    'earTrainerCheckBtn',
    state.playing || state.finished || !state.hasPlayed || !state.selectionsComplete
  );
  setDisabled('earTrainerRevealBtn', state.finished);
}
