// Fretboard rendering functions

import type { CAGEDShape, ScaleType, DisplayMode } from "../../shared/types";
import {
  NOTES,
  PATTERN_NUMBERS,
  LINE_COLORS,
  TOTAL_FRETS,
  NUT_POSITION,
  FRET_WIDTH,
  STRING_Y_POSITIONS,
  STRING_ORDER,
} from "../../shared/constants";
import {
  getNoteAtPosition,
  isInScale,
  getScaleDegree,
} from "../../shared/musicTheory";
import {
  generateFretLinesHTML,
  generateDotsHTML,
  generateStringsHTML,
  generateFretNumbersHTML,
} from "../../shared/fretboardRenderer";
import { getShapeAtFret, getShapeBoundaries } from "./caged";

/**
 * Render the CAGED header showing shape labels
 * @param rootIndex - The root note index (0-11)
 */
export function renderCAGEDHeader(rootIndex: number): void {
  const header = document.getElementById("cagedHeader");
  if (!header) return;

  header.innerHTML = "";

  // Create header elements positioned correctly using getShapeBoundaries
  const headerShapes = getShapeBoundaries(rootIndex, TOTAL_FRETS);

  // Build header HTML
  let headerHTML = "";
  for (const { shape, fret } of headerShapes) {
    const pattern = PATTERN_NUMBERS[shape];
    const color = LINE_COLORS[shape];

    // Calculate left position (approximate based on fret)
    const leftPos = NUT_POSITION + fret * FRET_WIDTH;

    headerHTML += `
            <div class="shape-label" style="position: absolute; left: ${leftPos}px;">
                <span class="shape-letter">${shape}</span>
                <span class="shape-text">shape</span>
                <div class="shape-line" style="background-color: ${color};"></div>
                <span class="shape-pattern">pattern ${pattern}</span>
            </div>
        `;
  }

  header.style.position = "relative";
  header.style.height = "120px";
  header.style.minWidth = "1400px";
  header.innerHTML = headerHTML;
}

// Interval display mapping by scale degree index for each scale type
// Major pentatonic: R, 2, 3, 5, 6 (indices 0, 1, 2, 3, 4)
// Minor pentatonic: R, b3, 4, 5, b7 (indices 0, 1, 2, 3, 4)
const INTERVAL_DISPLAY: Record<
  ScaleType,
  Array<{ className: string; text: string }>
> = {
  major: [
    { className: "interval-root", text: "R" },
    { className: "interval-other", text: "2" },
    { className: "interval-third", text: "3" },
    { className: "interval-fifth", text: "5" },
    { className: "interval-other", text: "6" },
  ],
  minor: [
    { className: "interval-root", text: "R" },
    { className: "interval-third", text: "3" },
    { className: "interval-other", text: "4" },
    { className: "interval-fifth", text: "5" },
    { className: "interval-other", text: "7" },
  ],
};

function getIntervalDetails(
  scaleDegree: number,
  scaleType: ScaleType,
): { className: string; text: string } {
  return INTERVAL_DISPLAY[scaleType][scaleDegree];
}

function generateShapeZonesHTML(rootIndex: number): string {
  let html = "";
  let prevShape: CAGEDShape | null = null;
  let shapeStart = 0;

  for (let fret = 0; fret <= TOTAL_FRETS + 1; fret++) {
    const shape: CAGEDShape | null =
      fret <= TOTAL_FRETS ? getShapeAtFret(rootIndex, fret) : null;
    if (shape !== prevShape) {
      if (prevShape !== null) {
        const startX =
          shapeStart === 0
            ? 0
            : NUT_POSITION + (shapeStart - 1) * FRET_WIDTH + FRET_WIDTH / 2;
        const endX = NUT_POSITION + (fret - 1) * FRET_WIDTH + FRET_WIDTH / 2;
        const width = endX - startX;
        html += `<div class="shape-zone shape-${prevShape.toLowerCase()}" style="left: ${startX}px; width: ${width}px;"></div>`;
      }
      shapeStart = fret;
      prevShape = shape;
    }
  }
  return html;
}

function generateNoteHTMLForFret(
  stringIdx: number,
  stringY: number,
  fret: number,
  options: {
    rootIndex: number;
    scaleType: ScaleType;
    displayMode: DisplayMode;
  },
): string {
  const { rootIndex, scaleType, displayMode } = options;
  const noteIndex = getNoteAtPosition(stringIdx, fret);
  const inScale = isInScale(noteIndex, rootIndex, scaleType);

  if (!inScale) return "";

  const x =
    fret === 0 ? NUT_POSITION / 2 : NUT_POSITION + (fret - 0.5) * FRET_WIDTH;

  if (displayMode === "notes") {
    const noteName = NOTES[noteIndex];
    const isRoot = noteIndex === rootIndex;
    const noteClass = isRoot ? "note note-square" : "note note-circle";
    return `<div class="${noteClass}" style="left: ${x}px; top: ${stringY}px;">${noteName}</div>`;
  }

  const scaleDegree = getScaleDegree(noteIndex, rootIndex, scaleType);
  const { className, text } = getIntervalDetails(scaleDegree, scaleType);
  return `<div class="note ${className}" style="left: ${x}px; top: ${stringY}px;">${text}</div>`;
}

function generateNotesHTML(
  rootIndex: number,
  scaleType: ScaleType,
  displayMode: DisplayMode,
): string {
  let html = "";
  const options = { rootIndex, scaleType, displayMode };

  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    const stringY = STRING_Y_POSITIONS[visualIdx];

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      html += generateNoteHTMLForFret(stringIdx, stringY, fret, options);
    }
  }
  return html;
}

/**
 * Render the fretboard with notes and shapes
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @param displayMode - The display mode ("notes" or "intervals")
 */
export function renderFretboard(
  rootIndex: number,
  scaleType: ScaleType,
  displayMode: DisplayMode,
): void {
  const fretboard = document.getElementById("fretboard");
  const fretNumbers = document.getElementById("fretNumbers");

  if (!fretboard || !fretNumbers) return;

  let fretboardHTML = "";

  // Add CAGED shape background zones
  fretboardHTML += generateShapeZonesHTML(rootIndex);

  // Add fret lines (vertical)
  fretboardHTML += generateFretLinesHTML();

  // Add fret dots
  fretboardHTML += generateDotsHTML();

  // Add 6 string lines (horizontal)
  fretboardHTML += generateStringsHTML();

  // Add notes positioned on strings
  fretboardHTML += generateNotesHTML(rootIndex, scaleType, displayMode);

  fretboard.innerHTML = fretboardHTML;

  // Render fret numbers
  fretNumbers.innerHTML = generateFretNumbersHTML();
}

/**
 * Update the current note display element
 * @param rootIndex - The root note index (0-11)
 */
export function updateNoteDisplay(rootIndex: number): void {
  const currentNoteElement = document.getElementById("currentNote");
  if (currentNoteElement) {
    currentNoteElement.textContent = NOTES[rootIndex];
  }
}
