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
  getShapeBoundaries,
  getChordShapePositions,
  getPentatonicPositionBoundaries,
  getShapesForFret,
  getPentatonicPositionsForFret,
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

// =============================================================================
// Note-Centric Multi-Pass Shading System
// =============================================================================

/**
 * Shape colors as RGBA values for blending
 * These correspond to the CSS colors used for shape zones
 */
const SHAPE_COLORS_RGBA: Record<CAGEDShape, { r: number; g: number; b: number; a: number }> = {
  C: { r: 244, g: 143, b: 177, a: 0.6 },
  A: { r: 206, g: 147, b: 216, a: 0.6 },
  G: { r: 165, g: 214, b: 167, a: 0.6 },
  E: { r: 255, g: 204, b: 128, a: 0.6 },
  D: { r: 144, g: 202, b: 249, a: 0.6 },
};

/**
 * Pentatonic position colors (mapped from CAGED shapes via CAGED_TO_PENTATONIC_POSITION)
 */
const POSITION_COLORS_RGBA: Record<PentatonicPosition, { r: number; g: number; b: number; a: number }> = {
  1: { r: 244, g: 143, b: 177, a: 0.6 }, // E shape → Position 1
  2: { r: 206, g: 147, b: 216, a: 0.6 }, // D shape → Position 2
  3: { r: 165, g: 214, b: 167, a: 0.6 }, // C shape → Position 3
  4: { r: 255, g: 204, b: 128, a: 0.6 }, // A shape → Position 4
  5: { r: 144, g: 202, b: 249, a: 0.6 }, // G shape → Position 5
};

/**
 * Cell identifier for tracking colored cells
 */
type CellKey = `${number}-${number}`; // row-fret

interface CellColorState {
  colors: Array<{ r: number; g: number; b: number; a: number }>;
}

/**
 * Blend multiple RGBA colors using alpha compositing
 */
function blendColors(
  colors: Array<{ r: number; g: number; b: number; a: number }>,
): { r: number; g: number; b: number; a: number } {
  if (colors.length === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (colors.length === 1) {
    return colors[0];
  }

  // Use additive blending for overlapping shapes
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalA = 0;

  for (const color of colors) {
    totalR += color.r * color.a;
    totalG += color.g * color.a;
    totalB += color.b * color.a;
    totalA += color.a;
  }

  if (totalA === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Average the colors weighted by alpha
  return {
    r: Math.min(255, Math.round(totalR / totalA)),
    g: Math.min(255, Math.round(totalG / totalA)),
    b: Math.min(255, Math.round(totalB / totalA)),
    a: Math.min(1, totalA / colors.length + 0.1 * (colors.length - 1)), // Slightly increase alpha for overlaps
  };
}

/**
 * Convert RGBA to CSS string
 */
function rgbaToCSS(color: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/**
 * Get the row boundaries for note cells.
 * 7 rows total: boundaries are the string Y positions themselves.
 *   Row 0: top edge → string 0 (above high E)
 *   Row 1: string 0 → string 1 (between high E and B)
 *   Row 2: string 1 → string 2 (between B and G)
 *   Row 3: string 2 → string 3 (between G and D)
 *   Row 4: string 3 → string 4 (between D and A)
 *   Row 5: string 4 → string 5 (between A and low E)
 *   Row 6: string 5 → bottom edge (below low E)
 *
 * For a note on visual string i: above = row i, below = row i+1.
 */
function getCellRowBoundaries(): Array<{ top: number; bottom: number }> {
  const yPositions = STRING_Y_POSITIONS;
  const topEdge = 5;
  const bottomEdge = 195;

  const rows: Array<{ top: number; bottom: number }> = [];

  // Row 0: above first string
  rows.push({ top: topEdge, bottom: yPositions[0] });

  // Rows 1-5: between adjacent strings
  for (let i = 0; i < yPositions.length - 1; i++) {
    rows.push({ top: yPositions[i], bottom: yPositions[i + 1] });
  }

  // Row 6: below last string
  rows.push({ top: yPositions[yPositions.length - 1], bottom: bottomEdge });

  return rows;
}

/**
 * Get visual row index for a string (which rows are above and below this string)
 * Returns { above: rowIndex, below: rowIndex }
 */
function getRowsForString(visualStringIdx: number): { above: number; below: number } {
  // Visual string 0 is at top (high E), visual string 5 is at bottom (low E)
  // Row 0 is above high E, row 1 is between high E and B, etc.
  return {
    above: visualStringIdx,      // Row above this string
    below: visualStringIdx + 1,  // Row below this string
  };
}

/**
 * Find nearest previous fret with notes
 */
function findPreviousFret(
  fret: number,
  minFret: number,
  fretExtents: Map<number, { minRow: number; maxRow: number }>,
): number | null {
  for (let f = fret - 1; f >= minFret; f--) {
    if (fretExtents.has(f)) {
      return f;
    }
  }
  return null;
}

/**
 * Find nearest next fret with notes
 */
function findNextFret(
  fret: number,
  maxFret: number,
  fretExtents: Map<number, { minRow: number; maxRow: number }>,
): number | null {
  for (let f = fret + 1; f <= maxFret; f++) {
    if (fretExtents.has(f)) {
      return f;
    }
  }
  return null;
}

/**
 * Merge two extents to create a union
 */
function mergeExtents(
  extent1: { minRow: number; maxRow: number },
  extent2: { minRow: number; maxRow: number },
): { minRow: number; maxRow: number } {
  return {
    minRow: Math.min(extent1.minRow, extent2.minRow),
    maxRow: Math.max(extent1.maxRow, extent2.maxRow),
  };
}

/**
 * Calculate row extent for a gap fret by interpolating between neighboring frets
 */
function calculateGapFretExtent(
  fret: number,
  minFret: number,
  maxFret: number,
  fretExtents: Map<number, { minRow: number; maxRow: number }>,
): { minRow: number; maxRow: number } | null {
  const prev = findPreviousFret(fret, minFret, fretExtents);
  const next = findNextFret(fret, maxFret, fretExtents);

  // Use union of neighboring extents to bridge the gap
  if (prev !== null && next !== null) {
    const prevExtent = fretExtents.get(prev);
    const nextExtent = fretExtents.get(next);
    if (prevExtent && nextExtent) {
      return mergeExtents(prevExtent, nextExtent);
    }
  }

  // Use previous extent if available
  if (prev !== null) {
    return fretExtents.get(prev) || null;
  }

  // Use next extent if available
  if (next !== null) {
    return fretExtents.get(next) || null;
  }

  return null;
}

/**
 * Build per-fret row extents from notes in a group
 */
function buildFretExtents(
  group: { checkFret: (fret: number) => boolean },
  notePositions: Array<{ visualStringIdx: number; stringIdx: number; fret: number }>,
): Map<number, { minRow: number; maxRow: number }> {
  const fretExtents = new Map<number, { minRow: number; maxRow: number }>();

  for (const { visualStringIdx, fret } of notePositions) {
    if (!group.checkFret(fret)) continue;

    const { above, below } = getRowsForString(visualStringIdx);
    const existing = fretExtents.get(fret);
    if (!existing) {
      fretExtents.set(fret, { minRow: above, maxRow: below });
    } else {
      existing.minRow = Math.min(existing.minRow, above);
      existing.maxRow = Math.max(existing.maxRow, below);
    }
  }

  return fretExtents;
}

/**
 * Add color to a cell in the color map
 */
function addColorToCell(
  cellColors: Map<CellKey, CellColorState>,
  row: number,
  fret: number,
  color: { r: number; g: number; b: number; a: number },
): void {
  const key: CellKey = `${row}-${fret}`;
  if (!cellColors.has(key)) {
    cellColors.set(key, { colors: [] });
  }
  const cell = cellColors.get(key);
  if (cell) {
    cell.colors.push(color);
  }
}

/**
 * Fill cells with color for a fret range
 */
function fillFretRange(
  minFret: number,
  maxFret: number,
  fretExtents: Map<number, { minRow: number; maxRow: number }>,
  cellColors: Map<CellKey, CellColorState>,
  color: { r: number; g: number; b: number; a: number },
): void {
  for (let fret = minFret; fret <= maxFret; fret++) {
    const extent = fretExtents.get(fret) || calculateGapFretExtent(fret, minFret, maxFret, fretExtents);

    if (!extent) continue;

    // Color all rows in this extent for this fret
    for (let row = extent.minRow; row <= extent.maxRow; row++) {
      addColorToCell(cellColors, row, fret, color);
    }
  }
}

/**
 * Process a single group (shape or position) and add colors to cells
 */
function processGroupShading(
  group: {
    color: { r: number; g: number; b: number; a: number };
    checkFret: (fret: number) => boolean;
  },
  notePositions: Array<{ visualStringIdx: number; stringIdx: number; fret: number }>,
  cellColors: Map<CellKey, CellColorState>,
): void {
  // Build per-fret row extents from notes in this group
  const fretExtents = buildFretExtents(group, notePositions);

  if (fretExtents.size === 0) return;

  // Find fret range for this group
  const shapeFrets = [...fretExtents.keys()].sort((a, b) => a - b);
  const minFret = shapeFrets[0];
  const maxFret = shapeFrets[shapeFrets.length - 1];

  // Fill all frets in range, interpolating gap frets
  fillFretRange(minFret, maxFret, fretExtents, cellColors, group.color);
}

/**
 * Collect all note positions in the scale
 */
function collectNotePositions(
  rootIndex: number,
  scaleType: ScaleType,
): Array<{ visualStringIdx: number; stringIdx: number; fret: number }> {
  const notePositions: Array<{ visualStringIdx: number; stringIdx: number; fret: number }> = [];
  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const noteIndex = getNoteAtPosition(stringIdx, fret);
      if (isInScale(noteIndex, rootIndex, scaleType)) {
        notePositions.push({ visualStringIdx: visualIdx, stringIdx, fret });
      }
    }
  }
  return notePositions;
}

/**
 * Build groups for shading based on highlight mode
 */
function buildShadingGroups(
  rootIndex: number,
  highlightMode: HighlightMode,
): Array<{
  color: { r: number; g: number; b: number; a: number };
  checkFret: (fret: number) => boolean;
}> {
  const groups: Array<{
    color: { r: number; g: number; b: number; a: number };
    checkFret: (fret: number) => boolean;
  }> = [];

  if (highlightMode === "caged") {
    const shapesOrder: CAGEDShape[] = ["C", "A", "G", "E", "D"];
    for (const shape of shapesOrder) {
      groups.push({
        color: SHAPE_COLORS_RGBA[shape],
        checkFret: (fret) => getShapesForFret(rootIndex, fret).includes(shape),
      });
    }
  } else {
    const positionsOrder: PentatonicPosition[] = [1, 2, 3, 4, 5];
    for (const position of positionsOrder) {
      groups.push({
        color: POSITION_COLORS_RGBA[position],
        checkFret: (fret) => getPentatonicPositionsForFret(rootIndex, fret).includes(position),
      });
    }
  }

  return groups;
}

/**
 * Generate HTML from colored cells
 */
function generateCellsHTML(cellColors: Map<CellKey, CellColorState>): string {
  let html = "";
  const rowBoundaries = getCellRowBoundaries();

  for (const [key, state] of cellColors.entries()) {
    const [rowStr, fretStr] = key.split("-");
    const row = Number.parseInt(rowStr, 10);
    const fret = Number.parseInt(fretStr, 10);

    const blendedColor = blendColors(state.colors);
    const cssColor = rgbaToCSS(blendedColor);

    const rowBounds = rowBoundaries[row];
    if (!rowBounds) continue;

    // Calculate cell position
    const top = rowBounds.top;
    const height = rowBounds.bottom - rowBounds.top;

    // Horizontal position: each fret's cell spans one full fret width
    const left = fret === 0 ? 0 : NUT_POSITION + (fret - 1) * FRET_WIDTH;
    const width = fret === 0 ? NUT_POSITION : FRET_WIDTH;

    html += `<div class="note-zone-cell" style="position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; background-color: ${cssColor};"></div>`;
  }

  return html;
}

/**
 * Generate note-centric zone HTML using multi-pass shading
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @param highlightMode - The highlight mode ("caged" or "pentatonic")
 */
function generateNoteCentricZonesHTML(
  rootIndex: number,
  scaleType: ScaleType,
  highlightMode: HighlightMode,
): string {
  // Track colors for each cell
  const cellColors = new Map<CellKey, CellColorState>();

  // Collect all note positions in the scale
  const notePositions = collectNotePositions(rootIndex, scaleType);

  // Build groups: each group is a shape (CAGED) or position (pentatonic)
  const groups = buildShadingGroups(rootIndex, highlightMode);

  // Multi-pass shading per group
  for (const group of groups) {
    processGroupShading(group, notePositions, cellColors);
  }

  // Generate HTML for all colored cells
  return generateCellsHTML(cellColors);
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

  // Add note-centric shape zones with multi-pass blending
  fretboardHTML += generateNoteCentricZonesHTML(rootIndex, scaleType, highlightMode);

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
