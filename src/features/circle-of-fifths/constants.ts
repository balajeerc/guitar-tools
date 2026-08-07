// The twelve positions of the circle, clockwise from C at 12 o'clock.

export interface CircleKey {
  /** Preferred major-key spelling, shown in the outer ring */
  readonly major: string;
  /** Enharmonic alternative, shown smaller just inside the preferred spelling */
  readonly majorAlt?: string;
  /** Relative minor tonic, shown in the middle ring (rendered with an "m") */
  readonly minor: string;
}

// Where a key has two viable spellings, the one needing fewer accidentals wins
// (B over C♭, D♭ over C♯); the six-and-six tie at F♯/G♭ is spelled flat.
export const CIRCLE_KEYS: readonly CircleKey[] = [
  { major: "C", minor: "A" },
  { major: "G", minor: "E" },
  { major: "D", minor: "B" },
  { major: "A", minor: "F♯" },
  { major: "E", minor: "C♯" },
  { major: "B", majorAlt: "C♭", minor: "G♯" },
  { major: "G♭", majorAlt: "F♯", minor: "E♭" },
  { major: "D♭", majorAlt: "C♯", minor: "B♭" },
  { major: "A♭", minor: "F" },
  { major: "E♭", minor: "C" },
  { major: "B♭", minor: "G" },
  { major: "F", minor: "D" },
];
