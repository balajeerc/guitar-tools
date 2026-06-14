// Pure logic for note grouping bands on the discovery fretboard.
//
// Natural notes are split into two groups: A-B-C and D-E-F. When grouping is
// enabled the renderer draws a coloured band along each string segment that
// connects consecutive notes belonging to the same group. G and all
// sharps/flats are intentionally left ungrouped.

import { NOTES, TOTAL_FRETS, STRING_ORDER } from "../../shared/constants";
import { getNoteAtPosition } from "../../shared/musicTheory";

export type NoteGroup = "abc" | "def";

// Pitch-class index (A=0, A#=1, B=2, C=3, ...) -> group
const GROUP_BY_PITCH_CLASS: Readonly<Record<number, NoteGroup>> = {
  0: "abc", // A
  2: "abc", // B
  3: "abc", // C
  5: "def", // D
  7: "def", // E
  8: "def", // F
};

// Display label for each group's legend entry
export const GROUP_LABELS: Readonly<Record<NoteGroup, string>> = {
  abc: "A · B · C",
  def: "D · E · F",
};

// Largest fret gap (in semitones) that still connects two same-group notes.
// Within an octave the widest within-group step is A->B / D->E = 2 frets, or
// 3 frets when the middle note is hidden. The next same-group note an octave
// up is at least 9 frets away, so 4 connects a group without bridging octaves.
const MAX_GROUP_FRET_GAP = 4;

function getNoteGroup(pitchClass: number): NoteGroup | null {
  return GROUP_BY_PITCH_CLASS[pitchClass] ?? null;
}

export interface GroupBand {
  /** Visual string index, 0 = high E (top), 5 = low E (bottom) */
  readonly visualStringIndex: number;
  readonly group: NoteGroup;
  readonly startFret: number;
  readonly endFret: number;
}

interface GroupNote {
  readonly fret: number;
  readonly group: NoteGroup;
}

/** Collect the selected, grouped notes along a single string, low fret first. */
function collectGroupNotes(
  stringIdx: number,
  selectedNotes: Set<string>,
): GroupNote[] {
  const notes: GroupNote[] = [];
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const pitchClass = getNoteAtPosition(stringIdx, fret);
    if (!selectedNotes.has(NOTES[pitchClass])) continue;
    const group = getNoteGroup(pitchClass);
    if (group) notes.push({ fret, group });
  }
  return notes;
}

/** Merge a string's grouped notes into bands of consecutive same-group runs. */
function bandsForString(
  visualStringIndex: number,
  groupNotes: GroupNote[],
): GroupBand[] {
  const bands: GroupBand[] = [];
  let i = 0;
  while (i < groupNotes.length) {
    const start = groupNotes[i];
    let end = start;
    let j = i + 1;
    while (
      j < groupNotes.length &&
      groupNotes[j].group === start.group &&
      groupNotes[j].fret - end.fret <= MAX_GROUP_FRET_GAP
    ) {
      end = groupNotes[j];
      j++;
    }
    // A band needs at least two notes to connect.
    if (end.fret > start.fret) {
      bands.push({
        visualStringIndex,
        group: start.group,
        startFret: start.fret,
        endFret: end.fret,
      });
    }
    i = j;
  }
  return bands;
}

/**
 * Compute the coloured grouping bands for the current selection.
 * Returns one band per consecutive same-group run on each selected string.
 */
export function computeGroupBands(
  selectedNotes: Set<string>,
  selectedStrings: Set<number>,
): GroupBand[] {
  const bands: GroupBand[] = [];
  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    // String numbers are 1-based for UI (1 = high E, 6 = low E)
    if (!selectedStrings.has(visualIdx + 1)) continue;
    const groupNotes = collectGroupNotes(stringIdx, selectedNotes);
    bands.push(...bandsForString(visualIdx, groupNotes));
  }
  return bands;
}
