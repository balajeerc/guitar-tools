import type { ScaleType } from "../../shared/types";
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
  getTriadShapes,
  TRIAD_STRING_SETS,
  type TriadDegree,
  type TriadInversion,
  type TriadShape,
} from "./shapes";

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

function generateNotesHTML(shapes: readonly TriadShape[], config: LayoutConfig): string {
  return shapes.flatMap((shape) => shape.notes.map(({ degree, stringIdx, fret }) => {
    const details = DEGREE_DETAILS[degree];
    const posStyle = `${config.fretAxis}: ${fretCenterPosition(fret, config)}px; ${config.stringAxis}: ${stringPosition(stringIdx, config)}px;`;
    return `<div class="note ${details.className}" style="${posStyle}" data-triad-shape="${shape.id}">${details.label}</div>`;
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

export function renderTriads(rootIndex: number, scaleType: ScaleType): void {
  const container = document.getElementById("triadBoards");
  if (!container) return;
  const config = getLayoutConfig();

  container.innerHTML = TRIAD_STRING_SETS.map((set) => `
    <section class="triad-string-set">
      <h2 class="triad-string-set-title">${set.label}<span>${set.tuning}</span></h2>
      <div class="fretboard-section">
        <div class="caged-header triad-header" id="${set.id}-header"></div>
        <div class="fretboard-container">
          <div class="fretboard" id="${set.id}-board"></div>
          <div class="fret-numbers">${generateFretNumbersHTML(config)}</div>
        </div>
      </div>
    </section>`).join("");

  for (const set of TRIAD_STRING_SETS) {
    const header = document.getElementById(`${set.id}-header`);
    const board = document.getElementById(`${set.id}-board`);
    if (!header || !board) continue;
    const shapes = getTriadShapes(rootIndex, scaleType, set);
    sizeCagedHeader(header, config);
    header.innerHTML = generateHeaderHTML(shapes, config);
    board.innerHTML = generateFretLinesHTML(config) + generateDotsHTML(config)
      + generateStringsHTML(config) + generateShapeLinesHTML(shapes, config)
      + generateNotesHTML(shapes, config);
    attachHeaderHover(header, board);
  }
}
