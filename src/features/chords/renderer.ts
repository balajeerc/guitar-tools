// Chords feature rendering: chord tones across the whole fretboard.

import type { DisplayMode } from "../../shared/types";
import { NOTES } from "../../shared/constants";
import { getNoteAtPosition } from "../../shared/musicTheory";
import {
  generateFretLinesHTML,
  generateDotsHTML,
  generateStringsHTML,
  generateFretNumbersHTML,
  generatePositionedNotesHTML,
  fretCenterPosition,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";
import {
  getChordType,
  getChordToneDegree,
  getChordNoteNames,
  intervalColorClass,
  type ChordType,
} from "./chordTypes";

function generateChordNotesHTML(
  chord: ChordType,
  rootIndex: number,
  displayMode: DisplayMode,
  config: LayoutConfig,
): string {
  return generatePositionedNotesHTML(config, ({ stringIdx, fret, stringPos }) => {
    const noteIndex = getNoteAtPosition(stringIdx, fret);
    const degree = getChordToneDegree(chord, noteIndex, rootIndex);
    if (degree === null) return "";

    const fretPos = fretCenterPosition(fret);
    const posStyle = `${config.fretAxis}: ${fretPos}px; ${config.stringAxis}: ${stringPos}px;`;

    // Match the Scales feature: plain square root + circles in notes mode,
    // degree-coloured notes in intervals mode.
    let noteClass: string;
    let text: string;
    if (displayMode === "intervals") {
      noteClass = `note ${intervalColorClass(degree)}`;
      text = degree;
    } else {
      noteClass = degree === "R" ? "note note-square" : "note note-circle";
      text = NOTES[noteIndex];
    }

    return `<div class="${noteClass}" style="${posStyle}">${text}</div>`;
  });
}

/** Update the chord info line, e.g. "C Major: C · E · G". */
function renderChordInfo(chord: ChordType, rootIndex: number): void {
  const info = document.getElementById("chordInfo");
  if (!info) return;
  const spelling = getChordNoteNames(chord, rootIndex).join(" · ");
  info.textContent = `${NOTES[rootIndex]} ${chord.name}: ${spelling}`;
}

/**
 * Render the chord's tones across the fretboard and update the chord info line.
 */
export function renderChords(
  rootIndex: number,
  chordTypeId: string,
  displayMode: DisplayMode,
): void {
  const fretboard = document.getElementById("fretboard-chords");
  const fretNumbers = document.getElementById("fretNumbers-chords");
  if (!fretboard || !fretNumbers) return;

  const config = getLayoutConfig();
  const chord = getChordType(chordTypeId);

  let html = "";
  html += generateFretLinesHTML(config);
  html += generateDotsHTML(config);
  html += generateStringsHTML(config);
  html += generateChordNotesHTML(chord, rootIndex, displayMode, config);

  fretboard.innerHTML = html;
  fretNumbers.innerHTML = generateFretNumbersHTML();

  renderChordInfo(chord, rootIndex);
}
