// Fretboard discovery rendering functions

import {
  NOTES,
  TOTAL_FRETS,
  NUT_POSITION,
  FRET_WIDTH,
  STRING_Y_POSITIONS,
  STRING_ORDER,
} from "../../shared/constants";
import { getNoteAtPosition } from "../../shared/musicTheory";
import {
  generateFretLinesHTML,
  generateDotsHTML,
  generateStringsHTML,
  generateFretNumbersHTML,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";

/**
 * Generate HTML for notes on the fretboard based on selected notes and strings
 */
function generateNotesHTML(
  selectedNotes: Set<string>,
  selectedStrings: Set<number>,
  config: LayoutConfig,
): string {
  let html = "";

  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    // String numbers are 1-based for UI (1 = high E, 6 = low E)
    const stringNumber = visualIdx + 1;

    // Skip if string is not selected
    if (!selectedStrings.has(stringNumber)) {
      continue;
    }

    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
    const stringPos = STRING_Y_POSITIONS[posIdx];

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const noteIndex = getNoteAtPosition(stringIdx, fret);
      const noteName = NOTES[noteIndex];

      // Skip if note is not selected
      if (!selectedNotes.has(noteName)) {
        continue;
      }

      const fretPos =
        fret === 0
          ? NUT_POSITION / 2
          : NUT_POSITION + (fret - 0.5) * FRET_WIDTH;

      html += `<div class="note note-circle" style="${config.fretAxis}: ${fretPos}px; ${config.stringAxis}: ${stringPos}px;">${noteName}</div>`;
    }
  }
  return html;
}

/**
 * Render the fretboard with notes
 */
export function renderFretboard(
  selectedNotes: Set<string>,
  selectedStrings: Set<number>,
): void {
  const fretboard = document.getElementById("fretboard-discovery");
  const fretNumbers = document.getElementById("fretNumbers-discovery");

  if (!fretboard || !fretNumbers) return;

  const config = getLayoutConfig();
  let fretboardHTML = "";

  // Add fret lines
  fretboardHTML += generateFretLinesHTML(config);

  // Add fret dots
  fretboardHTML += generateDotsHTML(config);

  // Add 6 string lines
  fretboardHTML += generateStringsHTML(config);

  // Add notes positioned on strings
  fretboardHTML += generateNotesHTML(selectedNotes, selectedStrings, config);

  fretboard.innerHTML = fretboardHTML;

  // Render fret numbers
  fretNumbers.innerHTML = generateFretNumbersHTML();
}
