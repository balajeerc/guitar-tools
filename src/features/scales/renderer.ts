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
  getPentatonicExtentsOnFretboard,
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
 * Handle position label hover - show position boundary box
 */
function handlePositionLabelHover(
  position: PentatonicPosition,
  startFret: number,
  endFret: number,
): void {
  const fretboard = document.getElementById("fretboard");
  if (!fretboard) return;

  // Remove any existing hover box
  handlePositionLabelLeave();

  const clampedEndFret = Math.min(endFret, TOTAL_FRETS);

  // Calculate the box dimensions
  // Notes are positioned at (fret - 0.5) * FRET_WIDTH, so align box edges with notes
  const startX =
    startFret === 0
      ? 0
      : NUT_POSITION + (startFret - 1) * FRET_WIDTH + FRET_WIDTH / 2;
  const endX = NUT_POSITION + (clampedEndFret - 1) * FRET_WIDTH + FRET_WIDTH / 2;
  const width = endX - startX;

  // Get the color for this position
  const color = POSITION_LINE_COLORS[position];

  // Create and append the hover box
  const hoverBox = document.createElement("div");
  hoverBox.className = "position-hover-box";
  hoverBox.style.left = `${startX}px`;
  hoverBox.style.width = `${width}px`;
  hoverBox.style.borderColor = color;
  hoverBox.id = "position-hover-box";

  fretboard.appendChild(hoverBox);
}

/**
 * Handle position label mouse leave - remove boundary box
 */
function handlePositionLabelLeave(): void {
  const hoverBox = document.getElementById("position-hover-box");
  if (hoverBox) {
    hoverBox.remove();
  }
}

/**
 * Generate HTML for CAGED shape header labels
 */
function generateCAGEDHeaderHTML(rootIndex: number): string {
  const headerShapes = getShapeBoundaries(rootIndex, TOTAL_FRETS);
  let html = "";

  for (let i = 0; i < headerShapes.length; i++) {
    const { shape, fret } = headerShapes[i];
    const pattern = PATTERN_NUMBERS[shape];
    const color = LINE_COLORS[shape];

    // Calculate the end fret of this shape (start of next shape or TOTAL_FRETS)
    const nextFret = i < headerShapes.length - 1 ? headerShapes[i + 1].fret : TOTAL_FRETS + 1;

    // Calculate center position of the shape span
    const shapeSpan = nextFret - fret;
    const centerFret = fret + (shapeSpan - 1) / 2;
    const centerX = fret === 0
      ? NUT_POSITION * 0.5 + FRET_WIDTH * (shapeSpan - 1) / 2
      : NUT_POSITION + centerFret * FRET_WIDTH;

    html += `
            <div class="shape-label" style="position: absolute; left: ${centerX}px;" data-shape="${shape}" data-start-fret="${fret}">
                <span class="shape-letter">${shape}</span>
                <span class="shape-text">shape</span>
                <div class="shape-line" style="background-color: ${color};"></div>
                <span class="shape-pattern">pattern ${pattern}</span>
            </div>
        `;
  }
  return html;
}

/**
 * Generate HTML for pentatonic position header labels
 */
function generatePentatonicHeaderHTML(
  rootIndex: number,
  scaleType: ScaleType,
): string {
  const extents = getPentatonicExtentsOnFretboard(rootIndex, scaleType);
  let html = "";

  for (const { position, startFret, endFret } of extents) {
    const positionLabel = POSITION_LABELS[position];
    const color = POSITION_LINE_COLORS[position];

    const positionSpan = endFret - startFret + 1;
    const centerFret = startFret + (positionSpan - 1) / 2;
    const centerX =
      startFret === 0
        ? NUT_POSITION * 0.5 + (FRET_WIDTH * (positionSpan - 1)) / 2
        : NUT_POSITION + (centerFret - 0.5) * FRET_WIDTH;

    html += `
            <div class="shape-label" style="position: absolute; left: ${centerX}px;" data-position="${position}" data-start-fret="${startFret}" data-end-fret="${endFret}">
                <span class="shape-letter">${positionLabel}</span>
                <span class="shape-text">position</span>
                <div class="shape-line" style="background-color: ${color};"></div>
            </div>
        `;
  }
  return html;
}

/**
 * Attach event listeners for CAGED shape labels
 */
function attachCAGEDEventListeners(header: HTMLElement): void {
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

/**
 * Attach event listeners for pentatonic position labels
 */
function attachPentatonicEventListeners(header: HTMLElement): void {
  const positionLabels = header.querySelectorAll(".shape-label");
  for (const label of positionLabels) {
    const position = Number.parseInt(
      label.getAttribute("data-position") || "0",
      10,
    ) as PentatonicPosition;
    const startFret = Number.parseInt(
      label.getAttribute("data-start-fret") || "0",
      10,
    );
    const endFret = Number.parseInt(
      label.getAttribute("data-end-fret") || "0",
      10,
    );

    label.addEventListener("mouseenter", () =>
      handlePositionLabelHover(position, startFret, endFret),
    );
    label.addEventListener("mouseleave", handlePositionLabelLeave);
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
  scaleType: ScaleType = "major",
): void {
  const header = document.getElementById("cagedHeader");
  if (!header) return;

  header.style.position = "relative";
  header.style.height = "120px";
  header.style.minWidth = "1400px";

  const headerHTML =
    highlightMode === "caged"
      ? generateCAGEDHeaderHTML(rootIndex)
      : generatePentatonicHeaderHTML(rootIndex, scaleType);

  header.innerHTML = headerHTML;

  if (highlightMode === "caged") {
    attachCAGEDEventListeners(header);
  } else {
    attachPentatonicEventListeners(header);
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

/** RGB color values for pentatonic position zone backgrounds */
const POSITION_ZONE_COLORS: Record<
  PentatonicPosition,
  [number, number, number]
> = {
  1: [244, 143, 177],
  2: [206, 147, 216],
  3: [165, 214, 167],
  4: [255, 204, 128],
  5: [144, 202, 249],
};

function blendPositionColors(positions: PentatonicPosition[]): string {
  const len = positions.length;
  const r = Math.round(
    positions.reduce((sum, p) => sum + POSITION_ZONE_COLORS[p][0], 0) / len,
  );
  const g = Math.round(
    positions.reduce((sum, p) => sum + POSITION_ZONE_COLORS[p][1], 0) / len,
  );
  const b = Math.round(
    positions.reduce((sum, p) => sum + POSITION_ZONE_COLORS[p][2], 0) / len,
  );
  return `rgba(${r}, ${g}, ${b}, 0.6)`;
}

/**
 * Build a map of fret number -> list of positions covering that fret.
 * Positions are added in order of their startFret (sorted by caller).
 */
function buildFretPositionMap(
  extents: Array<{
    position: PentatonicPosition;
    startFret: number;
    endFret: number;
  }>,
): Map<number, PentatonicPosition[]> {
  const map = new Map<number, PentatonicPosition[]>();
  for (const { position, startFret, endFret } of extents) {
    const clampedEnd = Math.min(endFret, TOTAL_FRETS);
    for (let fret = startFret; fret <= clampedEnd; fret++) {
      const existing = map.get(fret);
      if (existing) {
        existing.push(position);
      } else {
        map.set(fret, [position]);
      }
    }
  }
  return map;
}

/**
 * Group contiguous frets that share the same set of positions into segments.
 */
function groupFretSegments(
  fretPositions: Map<number, PentatonicPosition[]>,
): Array<{ startFret: number; endFret: number; positions: PentatonicPosition[] }> {
  const sortedFrets = [...fretPositions.keys()].sort((a, b) => a - b);
  if (sortedFrets.length === 0) return [];

  const segments: Array<{
    startFret: number;
    endFret: number;
    positions: PentatonicPosition[];
  }> = [];
  let segStart = sortedFrets[0];
  let segPositions = fretPositions.get(segStart) ?? [];
  let segKey = segPositions.join(",");

  for (let i = 1; i < sortedFrets.length; i++) {
    const fret = sortedFrets[i];
    const positions = fretPositions.get(fret) ?? [];
    const key = positions.join(",");

    if (fret !== sortedFrets[i - 1] + 1 || key !== segKey) {
      segments.push({ startFret: segStart, endFret: sortedFrets[i - 1], positions: segPositions });
      segStart = fret;
      segPositions = positions;
      segKey = key;
    }
  }
  segments.push({ startFret: segStart, endFret: sortedFrets[sortedFrets.length - 1], positions: segPositions });

  return segments;
}

function generatePentatonicZonesHTML(
  rootIndex: number,
  scaleType: ScaleType,
): string {
  const extents = getPentatonicExtentsOnFretboard(rootIndex, scaleType);
  const fretPositions = buildFretPositionMap(extents);
  const segments = groupFretSegments(fretPositions);

  let html = "";
  for (const { startFret, endFret, positions } of segments) {
    const startX =
      startFret === 0 ? 0 : NUT_POSITION + (startFret - 1) * FRET_WIDTH;
    const endX = NUT_POSITION + endFret * FRET_WIDTH;
    const color = blendPositionColors(positions);
    html += `<div class="shape-zone" style="left: ${startX}px; width: ${endX - startX}px; background-color: ${color};"></div>`;
  }
  return html;
}

function generateShapeZonesHTML(
  rootIndex: number,
  highlightMode: HighlightMode,
  scaleType: ScaleType,
): string {
  return highlightMode === "caged"
    ? generateCAGEDZonesHTML(rootIndex)
    : generatePentatonicZonesHTML(rootIndex, scaleType);
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
  fretboardHTML += generateShapeZonesHTML(rootIndex, highlightMode, scaleType);

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
