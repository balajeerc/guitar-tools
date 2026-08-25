// Fretboard discovery rendering functions

import {
  NOTES,
  TOTAL_FRETS,
  STRING_Y_POSITIONS,
  STRING_ORDER,
} from "../../shared/constants";
import { getNoteAtPosition } from "../../shared/musicTheory";
import {
  generateFretLinesHTML,
  generateDotsHTML,
  generateStringsHTML,
  generateFretNumbersHTML,
  fretCenterPosition,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";
import { computeGroupBands } from "./grouping";

// Thickness of a grouping band across the string axis, in pixels
const BAND_THICKNESS = 14;

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

      const fretPos = fretCenterPosition(fret, config);

      html += `<div class="note note-circle" style="${config.fretAxis}: ${fretPos}px; ${config.stringAxis}: ${stringPos}px;">${noteName}</div>`;
    }
  }
  return html;
}

/**
 * Generate HTML for the coloured grouping bands connecting same-group notes
 * along each string.
 */
function generateGroupBandsHTML(
  selectedNotes: Set<string>,
  selectedStrings: Set<number>,
  config: LayoutConfig,
): string {
  const bands = computeGroupBands(selectedNotes, selectedStrings);
  // Centre each band on its string line along the cross (string) axis.
  const centerTransform = config.isVertical ? "translateX(-50%)" : "translateY(-50%)";

  let html = "";
  for (const { visualStringIndex, group, startFret, endFret } of bands) {
    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - visualStringIndex : visualStringIndex;
    const stringPos = STRING_Y_POSITIONS[posIdx];

    const startPos = fretCenterPosition(startFret, config);
    const size = fretCenterPosition(endFret, config) - startPos;

    html += `<div class="note-group-band group-${group}" style="${config.fretAxis}: ${startPos}px; ${config.fretDimension}: ${size}px; ${config.stringAxis}: ${stringPos}px; ${config.stringThicknessProp}: ${BAND_THICKNESS}px; transform: ${centerTransform};"></div>`;
  }
  return html;
}

/**
 * Render the fretboard with notes
 */
export function renderFretboard(
  selectedNotes: Set<string>,
  selectedStrings: Set<number>,
  groupingEnabled = false,
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

  // Add grouping bands above the strings but below the notes
  if (groupingEnabled) {
    fretboardHTML += generateGroupBandsHTML(selectedNotes, selectedStrings, config);
  }

  // Add notes positioned on strings
  fretboardHTML += generateNotesHTML(selectedNotes, selectedStrings, config);

  fretboard.innerHTML = fretboardHTML;

  // Render fret numbers
  fretNumbers.innerHTML = generateFretNumbersHTML(config);
}
