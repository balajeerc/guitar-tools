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
  sizeCagedHeader,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";
import {
  getShapeAtFret,
  getShapeBoundaries,
  getChordShapePositions,
  getPentatonicExtentsOnFretboard,
} from "./caged";
import {
  getFullScaleExtentsOnFretboard,
  type ScalePositionExtent,
} from "./fullScale";

/** Check if a note is in the pentatonic scale but not a chord tone (R/3/5) */
function isPentatonicNonChordTone(
  noteIndex: number,
  rootIndex: number,
  scaleType: ScaleType,
): boolean {
  const relativeNote = (noteIndex - rootIndex + 12) % 12;
  const thirdInterval = scaleType === "major" ? 4 : 3;
  if (relativeNote === 0 || relativeNote === thirdInterval || relativeNote === 7) return false;
  return isInScale(noteIndex, rootIndex, scaleType, false);
}

// Track current scale type for hover handlers
let currentScaleType: ScaleType = "major";

/** Pixel boundary between adjacent non-overlapping CAGED zones. */
function cagedBoundaryPosition(fret: number, config: LayoutConfig): number {
  if (fret <= 0) return 0;
  if (fret > TOTAL_FRETS) return config.fretboardLength;
  return config.nutPosition + (fret - 0.5) * config.fretWidth;
}

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

  const config = getLayoutConfig();
  const clampedEndFret = Math.min(endFret, TOTAL_FRETS);

  // Keep the active position at full strength while de-emphasizing the rest
  // of the scale. The fret range is inclusive, matching the position extents.
  const notes = fretboard.querySelectorAll<HTMLElement>(".note[data-fret]");
  for (const note of notes) {
    const fret = Number.parseInt(note.dataset.fret ?? "", 10);
    note.classList.toggle(
      "position-dimmed",
      Number.isNaN(fret) || fret < startFret || fret > clampedEndFret,
    );
  }

  // Calculate the box dimensions, aligned with the dynamic note centers.
  const startPos =
    startFret === 0
      ? 0
      : config.nutPosition +
        (startFret - 1) * config.fretWidth +
        config.fretWidth / 2;
  const endPos =
    config.nutPosition +
    (clampedEndFret - 1) * config.fretWidth +
    config.fretWidth / 2;
  const size = endPos - startPos;

  // Get the color for this position
  const color = POSITION_LINE_COLORS[position];

  // Create and append the hover box
  const hoverBox = document.createElement("div");
  hoverBox.className = "position-hover-box";
  hoverBox.style[config.fretAxis] = `${startPos}px`;
  hoverBox.style[config.fretDimension] = `${size}px`;
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

  const dimmedNotes = document.querySelectorAll("#fretboard .note.position-dimmed");
  for (const note of dimmedNotes) {
    note.classList.remove("position-dimmed");
  }
}

/**
 * Generate HTML for CAGED shape header labels
 */
function generateCAGEDHeaderHTML(rootIndex: number, config: LayoutConfig): string {
  const headerShapes = getShapeBoundaries(rootIndex, TOTAL_FRETS);
  let html = "";

  for (let i = 0; i < headerShapes.length; i++) {
    const { shape, fret } = headerShapes[i];
    const pattern = PATTERN_NUMBERS[shape];
    const color = LINE_COLORS[shape];

    // Calculate the end fret of this shape (start of next shape or TOTAL_FRETS)
    const nextFret = i < headerShapes.length - 1 ? headerShapes[i + 1].fret : TOTAL_FRETS + 1;

    const startPos = cagedBoundaryPosition(fret, config);
    const endPos = cagedBoundaryPosition(nextFret, config);
    const centerPos = (startPos + endPos) / 2;

    html += `
            <div class="shape-label" style="position: absolute; ${config.fretAxis}: ${centerPos}px;" data-shape="${shape}" data-start-fret="${fret}">
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
 * Get the position extents used by a position-based highlight mode.
 */
function getPositionExtents(
  rootIndex: number,
  scaleType: ScaleType,
  highlightMode: "pentatonic" | "full",
): ScalePositionExtent[] {
  return highlightMode === "full"
    ? getFullScaleExtentsOnFretboard(rootIndex, scaleType)
    : getPentatonicExtentsOnFretboard(rootIndex, scaleType);
}

/** Generate HTML for numbered scale-position header labels. */
function generatePositionHeaderHTML(
  extents: readonly ScalePositionExtent[],
  config: LayoutConfig,
): string {
  let html = "";

  for (const { position, startFret, endFret, partial } of extents) {
    // Skip labels for positions that are partially cut off at fretboard edges
    if (partial) continue;

    const positionLabel = POSITION_LABELS[position];
    const color = POSITION_LINE_COLORS[position];

    const positionSpan = endFret - startFret + 1;
    const centerFret = startFret + (positionSpan - 1) / 2;
    const centerPos =
      startFret === 0
        ? config.nutPosition * 0.5 +
          (config.fretWidth * (positionSpan - 1)) / 2
        : config.nutPosition + (centerFret - 0.5) * config.fretWidth;

    html += `
            <div class="shape-label" style="position: absolute; ${config.fretAxis}: ${centerPos}px;" data-position="${position}" data-start-fret="${startFret}" data-end-fret="${endFret}">
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
 * Attach event listeners for numbered position labels
 */
function attachPositionEventListeners(header: HTMLElement): void {
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
 * @param highlightMode - The active fretboard grouping mode
 */
export function renderCAGEDHeader(
  rootIndex: number,
  highlightMode: HighlightMode = "caged",
  scaleType: ScaleType = "major",
): void {
  const header = document.getElementById("cagedHeader");
  if (!header) return;

  const config = getLayoutConfig();
  sizeCagedHeader(header, config);

  const headerHTML =
    highlightMode === "caged"
      ? generateCAGEDHeaderHTML(rootIndex, config)
      : generatePositionHeaderHTML(
          getPositionExtents(rootIndex, scaleType, highlightMode),
          config,
        );

  header.innerHTML = headerHTML;

  if (highlightMode === "caged") {
    attachCAGEDEventListeners(header);
  } else {
    attachPositionEventListeners(header);
  }
}

// Interval display mapping by scale degree index for each scale type
// Major pentatonic: R, 2, 3, 5, 6 (indices 0, 1, 2, 3, 4)
// Minor pentatonic: R, b3, 4, 5, b7 (indices 0, 1, 2, 3, 4)
const PENTATONIC_INTERVAL_DISPLAY: Record<
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

// Full scale interval display: R, 2, 3, 4, 5, 6, 7 (indices 0-6)
const FULL_INTERVAL_DISPLAY: Record<
  ScaleType,
  Array<{ className: string; text: string }>
> = {
  major: [
    { className: "interval-root", text: "R" },
    { className: "interval-pentatonic", text: "2" },
    { className: "interval-third", text: "3" },
    { className: "interval-other", text: "4" },
    { className: "interval-fifth", text: "5" },
    { className: "interval-pentatonic", text: "6" },
    { className: "interval-other", text: "7" },
  ],
  minor: [
    { className: "interval-root", text: "R" },
    { className: "interval-other", text: "2" },
    { className: "interval-third", text: "b3" },
    { className: "interval-pentatonic", text: "4" },
    { className: "interval-fifth", text: "5" },
    { className: "interval-other", text: "b6" },
    { className: "interval-pentatonic", text: "b7" },
  ],
};

function getIntervalDetails(
  scaleDegree: number,
  scaleType: ScaleType,
  useFullScale: boolean,
): { className: string; text: string } {
  const display = useFullScale
    ? FULL_INTERVAL_DISPLAY[scaleType]
    : PENTATONIC_INTERVAL_DISPLAY[scaleType];
  return display[scaleDegree];
}

function generateCAGEDZonesHTML(rootIndex: number, config: LayoutConfig): string {
  let html = "";
  let prevShape: CAGEDShape | null = null;
  let shapeStart = 0;

  for (let fret = 0; fret <= TOTAL_FRETS + 1; fret++) {
    const shape: CAGEDShape | null =
      fret <= TOTAL_FRETS ? getShapeAtFret(rootIndex, fret) : null;
    if (shape !== prevShape) {
      if (prevShape !== null) {
        const startPos = cagedBoundaryPosition(shapeStart, config);
        const endPos = cagedBoundaryPosition(fret, config);
        const size = endPos - startPos;
        html += `<div class="shape-zone shape-${prevShape.toLowerCase()}" style="${config.fretAxis}: ${startPos}px; ${config.fretDimension}: ${size}px;"></div>`;
      }
      shapeStart = fret;
      prevShape = shape;
    }
  }
  return html;
}

/** RGB color values for numbered position zone backgrounds */
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
  extents: ReadonlyArray<{
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

function generatePositionZonesHTML(
  extents: readonly ScalePositionExtent[],
  config: LayoutConfig,
): string {
  const fretPositions = buildFretPositionMap(extents);
  const segments = groupFretSegments(fretPositions);

  let html = "";
  for (const { startFret, endFret, positions } of segments) {
    const startPos =
      startFret === 0
        ? 0
        : config.nutPosition + (startFret - 1) * config.fretWidth;
    const endPos = config.nutPosition + endFret * config.fretWidth;
    const color = blendPositionColors(positions);
    html += `<div class="shape-zone" style="${config.fretAxis}: ${startPos}px; ${config.fretDimension}: ${endPos - startPos}px; background-color: ${color};"></div>`;
  }
  return html;
}

function generateShapeZonesHTML(
  rootIndex: number,
  highlightMode: HighlightMode,
  scaleType: ScaleType,
  config: LayoutConfig,
): string {
  if (highlightMode === "caged") {
    return generateCAGEDZonesHTML(rootIndex, config);
  }
  return generatePositionZonesHTML(
    getPositionExtents(rootIndex, scaleType, highlightMode),
    config,
  );
}

function generateNoteHTMLForFret(
  stringIdx: number,
  stringPos: number,
  fret: number,
  options: {
    rootIndex: number;
    scaleType: ScaleType;
    displayMode: DisplayMode;
    useFullScale: boolean;
  },
  config: LayoutConfig,
): string {
  const { rootIndex, scaleType, displayMode, useFullScale } = options;
  const noteIndex = getNoteAtPosition(stringIdx, fret);
  const inScale = isInScale(noteIndex, rootIndex, scaleType, useFullScale);

  if (!inScale) return "";

  const fretPos =
    fret === 0
      ? config.nutPosition / 2
      : config.nutPosition + (fret - 0.5) * config.fretWidth;

  // Add data attributes for string and fret position (for chord highlighting)
  const dataAttrs = `data-string="${stringIdx}" data-fret="${fret}"`;
  const posStyle = `${config.fretAxis}: ${fretPos}px; ${config.stringAxis}: ${stringPos}px;`;

  if (displayMode === "notes") {
    const noteName = NOTES[noteIndex];
    const isRoot = noteIndex === rootIndex;
    let noteClass: string;
    if (isRoot) {
      noteClass = "note note-square";
    } else if (useFullScale && isPentatonicNonChordTone(noteIndex, rootIndex, scaleType)) {
      noteClass = "note note-circle-yellow";
    } else {
      noteClass = "note note-circle";
    }
    return `<div class="${noteClass}" style="${posStyle}" ${dataAttrs}>${noteName}</div>`;
  }

  const scaleDegree = getScaleDegree(noteIndex, rootIndex, scaleType, useFullScale);
  const { className, text } = getIntervalDetails(scaleDegree, scaleType, useFullScale);
  return `<div class="note ${className}" style="${posStyle}" ${dataAttrs}>${text}</div>`;
}

function generateNotesHTML(
  rootIndex: number,
  scaleType: ScaleType,
  displayMode: DisplayMode,
  highlightMode: HighlightMode,
  config: LayoutConfig,
): string {
  let html = "";
  const useFullScale = highlightMode === "full";
  const options = { rootIndex, scaleType, displayMode, useFullScale };

  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
    const stringPos = STRING_Y_POSITIONS[posIdx];

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      html += generateNoteHTMLForFret(stringIdx, stringPos, fret, options, config);
    }
  }
  return html;
}

/**
 * Render the fretboard with notes and shapes
 * @param rootIndex - The root note index (0-11)
 * @param scaleType - The scale type ("major" or "minor")
 * @param displayMode - The display mode ("notes" or "intervals")
 * @param highlightMode - The active fretboard grouping mode
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

  const config = getLayoutConfig();
  let fretboardHTML = "";

  // Add shape background zones for the active grouping mode
  fretboardHTML += generateShapeZonesHTML(rootIndex, highlightMode, scaleType, config);

  // Add fret lines
  fretboardHTML += generateFretLinesHTML(config);

  // Add fret dots
  fretboardHTML += generateDotsHTML(config);

  // Add 6 string lines
  fretboardHTML += generateStringsHTML(config);

  // Add notes positioned on strings
  fretboardHTML += generateNotesHTML(rootIndex, scaleType, displayMode, highlightMode, config);

  fretboard.innerHTML = fretboardHTML;

  // Render fret numbers
  fretNumbers.innerHTML = generateFretNumbersHTML(config);
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
