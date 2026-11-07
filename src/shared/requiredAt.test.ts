import { describe, expect, it } from 'vitest';

import { requiredAt } from './requiredAt';

describe('required table entries', () => {
  it('reads an array entry including a falsy value', () => {
    expect(requiredAt([0, 7], 0)).toBe(0);
    expect(requiredAt([0, 7], 1)).toBe(7);
    expect(requiredAt([false], 0)).toBe(false);
  });

  it('reads typed arrays and numeric records', () => {
    expect(requiredAt(new Float32Array([0.5]), 0)).toBe(0.5);
    expect(requiredAt({ 12: 'octave' }, 12)).toBe('octave');
  });

  it.each([-1, 1, 1.5])('rejects a missing array position %s', (index) => {
    expect(() => requiredAt([7], index)).toThrow(new RangeError(`Missing value at index ${index}`));
  });

  it('rejects an explicitly undefined entry', () => {
    expect(() => {
      requiredAt([undefined], 0);
    }).toThrow(new RangeError('Missing value at index 0'));
  });
});
