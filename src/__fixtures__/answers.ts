import { change, click } from './browser';

/** Enter the digits, then use the same accidental controls as the player. */
export function enterDegrees(input: string, prefix: string, degrees: readonly string[]): void {
  change(input, degrees.map((degree) => degree.slice(-1)).join(''));
  for (const [index, degree] of degrees.entries()) {
    let clicks = 0;
    if (degree.startsWith('b')) clicks = 1;
    if (degree.startsWith('#')) clicks = 2;
    for (let count = 0; count < clicks; count++) click(`[data-${prefix}-accidental="${index}"]`);
  }
}
