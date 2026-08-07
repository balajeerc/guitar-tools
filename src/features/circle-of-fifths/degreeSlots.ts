// Maps the scale degrees of the selected key onto slices of the wheel.
//
// A key's diatonic chords always sit on the selected slice and its two
// neighbours — that adjacency is what makes the circle worth reading. The one
// exception is the diminished degree (VII in major, II in minor), which has no
// slice of its own and so goes unlabelled.

import { CIRCLE_KEYS } from "./constants";
import { getDegreeNumerals, type KeyMode } from "./theory";

interface DegreeSlot {
  /** Ring the chord sits in */
  readonly ring: KeyMode;
  /** Slices clockwise from the selected position */
  readonly offset: number;
}

const MAJOR_SLOTS: readonly (DegreeSlot | null)[] = [
  { ring: "major", offset: 0 }, // I
  { ring: "minor", offset: -1 }, // II
  { ring: "minor", offset: 1 }, // III
  { ring: "major", offset: -1 }, // IV
  { ring: "major", offset: 1 }, // V
  { ring: "minor", offset: 0 }, // VI
  null, // VII — diminished
];

const MINOR_SLOTS: readonly (DegreeSlot | null)[] = [
  { ring: "minor", offset: 0 }, // I
  null, // II — diminished
  { ring: "major", offset: 0 }, // III
  { ring: "minor", offset: -1 }, // IV
  { ring: "minor", offset: 1 }, // V
  { ring: "major", offset: -1 }, // VI
  { ring: "major", offset: 1 }, // VII
];

/** Key identifying one slice of one ring. */
export function sliceKey(ring: KeyMode, position: number): string {
  return `${ring}:${position}`;
}

/** Roman numerals to overlay on the wheel, keyed by {@link sliceKey}. */
export function getWheelNumerals(
  index: number,
  mode: KeyMode,
  degrees: readonly number[],
): Map<string, string> {
  const slots = mode === "major" ? MAJOR_SLOTS : MINOR_SLOTS;
  const degreeNumerals = getDegreeNumerals(mode);
  const numerals = new Map<string, string>();

  for (const degree of degrees) {
    const slot = slots[degree];
    if (!slot) continue;

    const position =
      (index + slot.offset + CIRCLE_KEYS.length) % CIRCLE_KEYS.length;
    numerals.set(sliceKey(slot.ring, position), degreeNumerals[degree]);
  }

  return numerals;
}
