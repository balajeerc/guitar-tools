import { describe, expect, it } from 'vitest';

import { getWheelNumerals, sliceKey } from './degreeSlots';
import { getDegreeNumerals, getDiatonicChords } from './theory';

describe('diatonic key spelling', () => {
  it.each([
    ['C', 'major', ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']],
    ['A', 'minor', ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']],
    ['G♭', 'major', ['G♭', 'A♭m', 'B♭m', 'C♭', 'D♭', 'E♭m', 'Fdim']],
    ['F♯', 'major', ['F♯', 'G♯m', 'A♯m', 'B', 'C♯', 'D♯m', 'E♯dim']],
    ['C♯', 'minor', ['C♯m', 'D♯dim', 'E', 'F♯m', 'G♯m', 'A', 'B']],
  ] as const)('spells every chord of %s %s', (tonic, mode, names) => {
    expect(getDiatonicChords(tonic, mode).map((chord) => chord.name)).toEqual(names);
    expect(getDiatonicChords(tonic, mode).map((chord) => chord.numeral)).toEqual(
      getDegreeNumerals(mode)
    );
  });
  it('cases diminished, major and minor numerals', () => {
    expect(getDegreeNumerals('major')).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(getDegreeNumerals('minor')).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
  });
  it('wraps adjacent wheel positions and omits diminished degrees', () => {
    expect([...getWheelNumerals(0, 'major', [0, 1, 2, 3, 4, 5, 6, 20])]).toEqual([
      ['major:0', 'I'],
      ['minor:11', 'ii'],
      ['minor:1', 'iii'],
      ['major:11', 'IV'],
      ['major:1', 'V'],
      ['minor:0', 'vi'],
    ]);
    expect([...getWheelNumerals(11, 'minor', [0, 1, 2, 3, 4, 5, 6])]).toEqual([
      ['minor:11', 'i'],
      ['major:11', 'III'],
      ['minor:10', 'iv'],
      ['minor:0', 'v'],
      ['major:10', 'VI'],
      ['major:0', 'VII'],
    ]);
    expect(sliceKey('minor', 2)).toBe('minor:2');
    expect([...getWheelNumerals(0, 'major', [])]).toEqual([]);
  });
});
