import type { ScaleType } from "../../shared/types";
import { NOTES } from "../../shared/constants";
import {
  STRING_ORDER,
  STRING_Y_POSITIONS,
} from "../../shared/constants";
import {
  fretCenterPosition,
  generateDotsHTML,
  generateFretLinesHTML,
  generateFretNumbersHTML,
  generateStringsHTML,
  sizeCagedHeader,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";
import {
  getOrbitNotes,
  getTriadShapes,
  TRIAD_STRING_SETS,
  type OrbitDegree,
  type OrbitNotePosition,
  type TriadDegree,
  type TriadInversion,
  type TriadQuality,
  type TriadShape,
  type TriadStringSet,
} from "./shapes";
import {
  getNearestTriadGroupings,
  progressionStepLabel,
  type ProgressionChord,
} from "./grouping";

export interface TriadsGroupingView {
  readonly chords: readonly ProgressionChord[];
  readonly activeStepIndex: number;
}

interface TriadBoardView {
  readonly set: TriadStringSet;
  readonly shapes: readonly TriadShape[];
}

const INVERSION_LABELS: Record<TriadInversion, { primary: string; secondary: string }> = {
  root: { primary: "R", secondary: "position" },
  first: { primary: "1st", secondary: "inversion" },
  second: { primary: "2nd", secondary: "inversion" },
};

const INVERSION_COLORS: Record<TriadInversion, string> = {
  root: "#e91e63",
  first: "#9c27b0",
  second: "#4caf50",
};

const DEGREE_DETAILS: Record<TriadDegree, { label: string; className: string }> = {
  root: { label: "R", className: "interval-root" },
  third: { label: "3", className: "interval-third" },
  fifth: { label: "5", className: "interval-fifth" },
};

const ORBIT_LABELS: Record<OrbitDegree, string> = {
  minorThird: "♭3",
  majorThird: "3",
  flatSeventh: "♭7",
};

function stringPosition(stringIdx: number, config: LayoutConfig): number {
  const visualIdx = STRING_ORDER.indexOf(stringIdx);
  return STRING_Y_POSITIONS[config.isVertical ? 5 - visualIdx : visualIdx];
}

function noteCoordinates(shape: TriadShape, config: LayoutConfig): string {
  return shape.notes
    .map(({ stringIdx, fret }) => {
      const fretPos = fretCenterPosition(fret, config);
      const across = stringPosition(stringIdx, config);
      return config.isVertical ? `${across},${fretPos}` : `${fretPos},${across}`;
    })
    .join(" ");
}

function generateShapeLinesHTML(shapes: readonly TriadShape[], config: LayoutConfig): string {
  return shapes.map((shape) => `
    <svg class="triad-shape-path" aria-hidden="true">
      <polyline points="${noteCoordinates(shape, config)}" style="stroke: ${INVERSION_COLORS[shape.inversion]}"></polyline>
    </svg>`).join("");
}

function orbitLineCoordinates(note: OrbitNotePosition, config: LayoutConfig): string {
  const across = stringPosition(note.stringIdx, config);
  const source = fretCenterPosition(note.sourceFret, config);
  const target = fretCenterPosition(note.fret, config);
  return config.isVertical
    ? `x1="${across}" y1="${source}" x2="${across}" y2="${target}"`
    : `x1="${source}" y1="${across}" x2="${target}" y2="${across}"`;
}

function generateOrbitLinesHTML(
  shapes: readonly TriadShape[],
  quality: TriadQuality,
  config: LayoutConfig,
): string {
  return shapes.map((shape) => {
    const lines = getOrbitNotes(shape, quality)
      .map((note) => `<line ${orbitLineCoordinates(note, config)}></line>`)
      .join("");
    return `<svg class="triad-shape-path triad-orbit-path" aria-hidden="true" data-triad-shape="${shape.id}">
      ${lines}
    </svg>`;
  }).join("");
}

function generateNotesHTML(
  shapes: readonly TriadShape[],
  quality: TriadQuality,
  config: LayoutConfig,
): string {
  return shapes.flatMap((shape) => shape.notes.map(({ degree, stringIdx, fret }) => {
    const details = DEGREE_DETAILS[degree];
    let label = details.label;
    if (degree === "third" && quality !== "major") label = "♭3";
    if (degree === "fifth" && quality === "diminished") label = "♭5";
    const posStyle = `${config.fretAxis}: ${fretCenterPosition(fret, config)}px; ${config.stringAxis}: ${stringPosition(stringIdx, config)}px;`;
    return `<div class="note ${details.className}" style="${posStyle}" data-triad-shape="${shape.id}">${label}</div>`;
  })).join("");
}

function generateOrbitNotesHTML(
  shapes: readonly TriadShape[],
  quality: TriadQuality,
  config: LayoutConfig,
): string {
  return shapes.flatMap((shape) => getOrbitNotes(shape, quality).map(({ degree, stringIdx, fret }) => {
    const posStyle = `${config.fretAxis}: ${fretCenterPosition(fret, config)}px; ${config.stringAxis}: ${stringPosition(stringIdx, config)}px;`;
    return `<div class="note triad-orbit-note" style="${posStyle}" data-triad-shape="${shape.id}" title="Blues cluster note">${ORBIT_LABELS[degree]}</div>`;
  })).join("");
}

function generateHeaderHTML(shapes: readonly TriadShape[], config: LayoutConfig): string {
  return shapes.map((shape) => {
    const label = INVERSION_LABELS[shape.inversion];
    const center = shape.centerFret === 0
      ? config.nutPosition / 2
      : config.nutPosition + (shape.centerFret - 0.5) * config.fretWidth;
    return `<div class="shape-label triad-shape-label" style="position: absolute; ${config.fretAxis}: ${center}px;" data-triad-shape="${shape.id}">
      <span class="shape-letter">${label.primary}</span>
      <span class="shape-text">${label.secondary}</span>
      <div class="shape-line" style="background-color: ${INVERSION_COLORS[shape.inversion]};"></div>
    </div>`;
  }).join("");
}

function attachHeaderHover(header: HTMLElement, board: HTMLElement): void {
  for (const label of header.querySelectorAll<HTMLElement>("[data-triad-shape]")) {
    const shapeId = label.dataset.triadShape;
    label.addEventListener("mouseenter", () => {
      for (const note of board.querySelectorAll(`[data-triad-shape="${shapeId}"]`)) note.classList.add("chord-highlight");
    });
    label.addEventListener("mouseleave", () => {
      for (const note of board.querySelectorAll(".chord-highlight")) note.classList.remove("chord-highlight");
    });
  }
}

function qualityLabel(quality: TriadQuality): string {
  return quality[0].toUpperCase() + quality.slice(1);
}

function getBoardViews(
  rootIndex: number,
  scaleType: ScaleType,
  grouping?: TriadsGroupingView,
): TriadBoardView[] {
  return TRIAD_STRING_SETS.map((set) => {
    if (!grouping) return { set, shapes: getTriadShapes(rootIndex, scaleType, set) };
    const groupings = getNearestTriadGroupings(grouping.chords, set);
    const activeShapes = groupings.flatMap((shapes) => shapes[grouping.activeStepIndex] ?? []);
    const uniqueShapes = [...new Map(activeShapes.map((shape) => [shape.id, shape])).values()];
    return { set, shapes: uniqueShapes };
  });
}

function chordDetails(chord?: ProgressionChord): string {
  if (!chord) return "";
  return ` · ${NOTES[chord.rootIndex]} ${qualityLabel(chord.quality)} (${progressionStepLabel(chord)})`;
}

function renderBoardShells(
  boards: readonly TriadBoardView[],
  config: LayoutConfig,
  details: string,
  isGrouping: boolean,
): string {
  const groupingClass = isGrouping ? " triad-grouping-step" : "";
  return boards.map(({ set }) => `
    <section class="triad-string-set${groupingClass}">
      <h2 class="triad-string-set-title">${set.label}<span>${set.tuning}${details}</span></h2>
      <div class="fretboard-section">
        <div class="caged-header triad-header" id="${set.id}-header"></div>
        <div class="fretboard-container">
          <div class="fretboard" id="${set.id}-board"></div>
          <div class="fret-numbers">${generateFretNumbersHTML(config)}</div>
        </div>
      </div>
    </section>`).join("");
}

function populateBoard(
  boardView: TriadBoardView,
  quality: TriadQuality,
  showOrbit: boolean,
  config: LayoutConfig,
): void {
  const { set, shapes } = boardView;
  const header = document.getElementById(`${set.id}-header`);
  const board = document.getElementById(`${set.id}-board`);
  if (!header || !board) return;
  sizeCagedHeader(header, config);
  header.innerHTML = generateHeaderHTML(shapes, config);
  board.innerHTML = generateFretLinesHTML(config) + generateDotsHTML(config)
    + generateStringsHTML(config) + generateShapeLinesHTML(shapes, config)
    + (showOrbit ? generateOrbitLinesHTML(shapes, quality, config) : "")
    + generateNotesHTML(shapes, quality, config)
    + (showOrbit ? generateOrbitNotesHTML(shapes, quality, config) : "");
  attachHeaderHover(header, board);
}

export function renderTriads(
  rootIndex: number,
  scaleType: ScaleType,
  showOrbit = false,
  grouping?: TriadsGroupingView,
): void {
  const container = document.getElementById("triadBoards");
  if (!container) return;
  const config = getLayoutConfig();
  const activeChord = grouping?.chords[grouping.activeStepIndex];
  const boards = getBoardViews(rootIndex, scaleType, grouping);
  const quality = activeChord?.quality ?? scaleType;

  container.classList.toggle("triad-boards-grouping", Boolean(grouping));
  container.innerHTML = renderBoardShells(boards, config, chordDetails(activeChord), Boolean(grouping));
  for (const board of boards) populateBoard(board, quality, showOrbit, config);
}
