import { describe, expect, it } from 'vitest';

import {
  degreesFromFirstNote,
  degreesFromTonic,
  evaluateDegreeGuess,
  isKeyGuessCorrect,
  sanitizeDegreeInput,
} from './manualGuess';
import { rootDisplacementLabel, rootNameFromKey } from './root';
import {
  accidentalPrefix,
  degreeBoxesHtml,
  formatDegree,
  formatTime,
  intervalAnswerHtml,
  nextDegreeAccidental,
} from './ui';

describe('manual scale-degree answers', () => {
  it('accepts only degrees 1 through 7 and caps the phrase length', () => {
    expect(sanitizeDegreeInput('0189b1♭2#3 4a567', 5)).toBe('11234');
    expect(sanitizeDegreeInput('123', 0)).toBe('');
  });
  it('normalizes octaves and negative intervals relative to a tonic', () => {
    expect(degreesFromTonic([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 59], 60)).toEqual([
      '1',
      'b2',
      '2',
      'b3',
      '3',
      '4',
      'b5',
      '5',
      'b6',
      '6',
      'b7',
      '7',
      '1',
      '7',
    ]);
    expect(degreesFromFirstNote([67, 69, 64])).toEqual(['1', '2', '6']);
    expect(degreesFromFirstNote([])).toEqual([]);
  });
  it.each([
    [
      ['1', '3'],
      ['1', '3'],
      ['2', '4'],
      {
        accuracy: 100,
        answerBasis: 'original-key',
        complete: true,
        correctCount: 2,
        correctPositions: [true, true],
      },
    ],
    [
      ['2', '4'],
      ['1', '3'],
      ['2', '4'],
      {
        accuracy: 100,
        answerBasis: 'first-note',
        complete: true,
        correctCount: 2,
        correctPositions: [true, true],
      },
    ],
    [
      ['1'],
      ['1', '3', '5'],
      ['2', '4', '6'],
      {
        accuracy: 33,
        answerBasis: null,
        complete: false,
        correctCount: 1,
        correctPositions: [true, false, false],
      },
    ],
    [
      ['2'],
      ['1', '3'],
      ['2', '4'],
      {
        accuracy: 50,
        answerBasis: null,
        complete: false,
        correctCount: 1,
        correctPositions: [true, false],
      },
    ],
    [
      ['1', '3', '5'],
      ['1', '3'],
      ['2', '4'],
      {
        accuracy: 100,
        answerBasis: null,
        complete: false,
        correctCount: 2,
        correctPositions: [true, true],
      },
    ],
    [
      [],
      [],
      [],
      {
        accuracy: 0,
        answerBasis: 'original-key',
        complete: true,
        correctCount: 0,
        correctPositions: [],
      },
    ],
  ])('scores phrase %j against both accepted bases', (answer, original, relative, result) => {
    expect(evaluateDegreeGuess(answer, original, relative)).toEqual(result);
  });
  it.each([
    ['C', 'C major', true],
    [' c MAJ ', 'C major', true],
    ['C minor', 'C major', false],
    ['F#m', 'F♯ minor', true],
    ['Eb min', 'E♭ minor', true],
    ['F', 'E♭ minor', false],
    ['', 'C major', null],
  ])('judges key %s against %s', (guess, key, correct) => {
    expect(isKeyGuessCorrect(guess, key)).toBe(correct);
  });
});

describe('musical answer labels', () => {
  it.each([
    [0, '0:00.0'],
    [999, '0:00.9'],
    [61_234, '1:01.2'],
    [600_000, '10:00.0'],
  ])('formats %i ms', (ms, label) => {
    expect(formatTime(ms)).toBe(label);
  });
  it.each([
    ['b3', '♭3', 'b', '#'],
    ['#4', '♯4', '#', ''],
    ['5', '5', '', 'b'],
  ])('labels accidental %s', (input, formatted, prefix, next) => {
    expect(formatDegree(input)).toBe(formatted);
    expect(accidentalPrefix(input)).toBe(prefix);
    expect(nextDegreeAccidental(input)).toBe(next);
  });
  it('renders answer boxes with accessible accidental controls and judgement', () => {
    document.body.innerHTML = degreeBoxesHtml({
      disabled: false,
      expectedLength: 4,
      idPrefix: 'answer',
      judgement: [true, false],
      values: ['b3', '#4', '5'],
    });
    expect(document.querySelectorAll('.filled')).toHaveLength(3);
    expect(document.querySelector('.correct')?.textContent).toBe('♭3');
    expect(document.querySelector('.incorrect')?.textContent).toBe('♯4');
    expect(
      [...document.querySelectorAll('button')].map((button) => [
        button.disabled,
        button.getAttribute('aria-label'),
      ])
    ).toEqual([
      [false, 'Interval 1 is flat; change accidental'],
      [false, 'Interval 2 is sharp; change accidental'],
      [false, 'Interval 3 is natural; change accidental'],
      [true, 'Interval 4 is natural; change accidental'],
    ]);
    expect(
      degreeBoxesHtml({
        disabled: true,
        expectedLength: 1,
        idPrefix: 'answer',
        judgement: null,
        values: ['1'],
      })
    ).toContain('disabled');
    expect(intervalAnswerHtml(['1', 'b3'])).toBe(
      '<div class="melodies-answer"><b>Correct intervals</b><div><span>1</span><i aria-hidden="true">–</i><span>♭3</span></div></div>'
    );
    expect(intervalAnswerHtml([], 'Answer')).toContain('<b>Answer</b>');
  });
  it.each([
    ['C major', 'C', 60, 'At the target root'],
    ['F# minor', 'F#', 67, '1 semitone above the target root'],
    ['B♭ major', 'B♭', 60, '2 semitones above the target root'],
    ['D♯ minor', 'D♯', 62, '11 semitones above the target root'],
    ['E♭ minor', 'E♭', 63, 'At the target root'],
  ])('describes a note relative to %s', (key, root, midi, label) => {
    expect(rootNameFromKey(key)).toBe(root);
    expect(rootDisplacementLabel(midi, key)).toBe(label);
  });
});
