// Fretboard rendering functions

import type {
  CAGEDShape,
  ScaleType,
  DisplayMode,
  HighlightMode,
  PentatonicPosition,
} from "../../shared/types";
import {
  NOTES,
  PATTERN_NUMBERS,
  LINE_COLORS,
  POSITION_LABELS,
  POSITION_LINE_COLORS,
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
import {
  getShapeAtFret,
  getShapeBoundaries,
  getChordShapePositions,
  getPentatonicPositionAtFret,
  getPentatonicPositionBoundaries,
} from "./caged";

// Track current scale type for hover handlers
let currentScaleType: ScaleType = "major";

/**
 * Handle shape label hover - highlight chord notes
 */
function handleShapeLabelHover(shape: CAGEDShape, startFret: number): void {
  const chordPositions = getChordShapePositions(shape, currentScaleType);

  // Find all notes that match the chord shape positions
  for (const { stringIdx, fretOffset } of chordPositions) {
    const absoluteFret = startFret + fretOffset;
    // Find notes at this position using data attributes
    const notes = document.querySelectorAll(
      `.note[data-string="${stringIdx}"][data-fret="${absoluteFret}"]`,
    );
    for (const note of notes) {
      note.classList.add("chord-highlight");
    }
  }
}

/**
 * Handle shape label mouse leave - remove highlights
 */
function handleShapeLabelLeave(): void {
  const highlightedNotes = document.querySelectorAll(".note.chord-highlight");
  for (const note of highlightedNotes) {
    note.classList.remove("chord-highlight");
  }
}

/**
 * Render the header showing shape/position labels
 * @param rootIndex - The root note index (0-11)
 * @param highlightMode - The highlight mode ("caged" or "pentatonic")
 */
export function renderCAGEDHeader(
  rootIndex: number,
  highlightMode: HighlightMode = "caged",
): void {
  const header = document.getElementById("cagedHeader");
  if (!header) return;

  header.innerHTML = "";

  let headerHTML = "";

  if (highlightMode === "caged") {
    // Create header elements positioned correctly using getShapeBoundaries
    const headerShapes = getShapeBoundaries(rootIndex, TOTAL_FRETS);

    // Build header HTML with data attributes for hover handlers
    for (const { shape, fret } of headerShapes) {
      const pattern = PATTERN_NUMBERS[shape];
      const color = LINE_COLORS[shape];

      // Calculate left position (approximate based on fret)
      const leftPos = NUT_POSITION + fret * FRET_WIDTH;

      headerHTML += `
              <div class="shape-label" style="position: absolute; left: ${leftPos}px;" data-shape="${shape}" data-start-fret="${fret}">
                  <span class="shape-letter">${shape}</span>
                  <span class="shape-text">shape</span>
                  <div class="shape-line" style="background-color: ${color};"></div>
                  <span class="shape-pattern">pattern ${pattern}</span>
              </div>
          `;
    }
  } else {
    // Pentatonic mode - display positions
    const headerPositions = getPentatonicPositionBoundaries(
      rootIndex,
      TOTAL_FRETS,
    );

    for (const { position, fret } of headerPositions) {
      const positionLabel = POSITION_LABELS[position];
      const color = POSITION_LINE_COLORS[position];

      // Calculate left position (approximate based on fret)
      const leftPos = NUT_POSITION + fret * FRET_WIDTH;

      headerHTML += `
              <div class="shape-label" style="position: absolute; left: ${leftPos}px;" data-position="${position}" data-start-fret="${fret}">
                  <span class="shape-letter">${positionLabel}</span>
                  <span class="shape-text">position</span>
                  <div class="shape-line" style="background-color: ${color};"></div>
              </div>
          `;
    }
  }

  header.style.position = "relative";
  header.style.height = "120px";
  header.style.minWidth = "1400px";
  header.innerHTML = headerHTML;

  // Attach hover event listeners to shape labels (only for CAGED mode)
  if (highlightMode === "caged") {
    const shapeLabels = header.querySelectorAll(".shape-label");
    for (const label of shapeLabels) {
      const shape = label.getAttribute("data-shape") as CAGEDShape;
      const startFret = Number.parseInt(
        label.getAttribute("data-start-fret") || "0",
        10,
      );

      label.addEventListener("mouseenter", () =>
        handleShapeLabelHover(shape, startFret),
      );
      label.addEventListener("mouseleave", handleShapeLabelLeave);
    }
  }
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

function generateCAGEDZonesHTML(rootIndex: number): string {
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

function generatePentatonicZonesHTML(rootIndex: number): string {
  let html = "";
  let prevPosition: PentatonicPosition | null = null;
  let positionStart = 0;

  for (let fret = 0; fret <= TOTAL_FRETS + 1; fret++) {
    const position: PentatonicPosition | null =
      fret <= TOTAL_FRETS ? getPentatonicPositionAtFret(rootIndex, fret) : null;
    if (position !== prevPosition) {
      if (prevPosition !== null) {
        const startX =
          positionStart === 0
            ? 0
            : NUT_POSITION + (positionStart - 1) * FRET_WIDTH + FRET_WIDTH / 2;
        const endX = NUT_POSITION + (fret - 1) * FRET_WIDTH + FRET_WIDTH / 2;
        const width = endX - startX;
        html += `<div class="shape-zone pent-pos-${prevPosition}" style="left: ${startX}px; width: ${width}px;"></div>`;
      }
      positionStart = fret;
      prevPosition = position;
    }
  }
  return html;
}

function generateShapeZonesHTML(
  rootIndex: number,
  highlightMode: HighlightMode,
): string {
  return highlightMode === "caged"
    ? generateCAGEDZonesHTML(rootIndex)
    : generatePentatonicZonesHTML(rootIndex);
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

  // Add data attributes for string and fret position (for chord highlighting)
  const dataAttrs = `data-string="${stringIdx}" data-fret="${fret}"`;

  if (displayMode === "notes") {
    const noteName = NOTES[noteIndex];
    const isRoot = noteIndex === rootIndex;
    const noteClass = isRoot ? "note note-square" : "note note-circle";
    return `<div class="${noteClass}" style="left: ${x}px; top: ${stringY}px;" ${dataAttrs}>${noteName}</div>`;
  }

  const scaleDegree = getScaleDegree(noteIndex, rootIndex, scaleType);
  const { className, text } = getIntervalDetails(scaleDegree, scaleType);
  return `<div class="note ${className}" style="left: ${x}px; top: ${stringY}px;" ${dataAttrs}>${text}</div>`;
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
 * @param highlightMode - The highlight mode ("caged" or "pentatonic")
 */
export function renderFretboard(
  rootIndex: number,
  scaleType: ScaleType,
  displayMode: DisplayMode,
  highlightMode: HighlightMode = "caged",
): void {
  // Update module-level scale type for hover handlers
  currentScaleType = scaleType;

  const fretboard = document.getElementById("fretboard");
  const fretNumbers = document.getElementById("fretNumbers");

  if (!fretboard || !fretNumbers) return;

  let fretboardHTML = "";

  // Add shape background zones (CAGED or Pentatonic based on highlightMode)
  fretboardHTML += generateShapeZonesHTML(rootIndex, highlightMode);

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
