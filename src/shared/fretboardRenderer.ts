// Common fretboard rendering functions

import {
  TOTAL_FRETS,
  NUT_POSITION,
  FRET_WIDTH,
  STRING_Y_POSITIONS,
  STRING_THICKNESS,
  STRING_ORDER,
  SINGLE_DOT_FRETS,
  DOUBLE_DOT_FRETS,
} from "./constants";
import type { LayoutConfig } from "./layout";

/** Pixel position (along the fret axis) of a note centred on the given fret. */
export function fretCenterPosition(fret: number): number {
  return fret === 0 ? NUT_POSITION / 2 : NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
}

export interface FretPosition {
  /** String index into tuning (0 = low E, 5 = high E) */
  readonly stringIdx: number;
  /** Visual string index (0 = high E at top, 5 = low E at bottom) */
  readonly visualIdx: number;
  readonly fret: number;
  /** Pixel position of the string along the cross (string) axis */
  readonly stringPos: number;
}

/**
 * Walk every fret position on the board (high E to low E, open to last fret)
 * and concatenate the HTML returned by `renderNote` for each. Return an empty
 * string from `renderNote` to skip a position.
 */
export function generatePositionedNotesHTML(
  config: LayoutConfig,
  renderNote: (position: FretPosition) => string,
): string {
  let html = "";
  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
    const stringPos = STRING_Y_POSITIONS[posIdx];

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      html += renderNote({ stringIdx, visualIdx, fret, stringPos });
    }
  }
  return html;
}

export function generateFretLinesHTML(config: LayoutConfig): string {
  let html = "";
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const pos = fret === 0 ? NUT_POSITION : NUT_POSITION + fret * FRET_WIDTH;
    const isNut = fret === 0;
    html += `<div class="fret-line ${isNut ? "nut" : ""}" style="${config.fretAxis}: ${pos}px;"></div>`;
  }
  return html;
}

export function generateDotsHTML(config: LayoutConfig): string {
  let html = "";
  for (const fret of SINGLE_DOT_FRETS) {
    const pos = NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
    html += `<div class="fret-dot single" style="${config.fretAxis}: ${pos}px;"></div>`;
  }

  for (const fret of DOUBLE_DOT_FRETS) {
    const pos = NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
    html += `<div class="fret-dot double-top" style="${config.fretAxis}: ${pos}px;"></div>`;
    html += `<div class="fret-dot double-bottom" style="${config.fretAxis}: ${pos}px;"></div>`;
  }
  return html;
}

export function generateStringsHTML(config: LayoutConfig): string {
  let html = "";
  for (let i = 0; i < 6; i++) {
    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - i : i;
    html += `<div class="string-line" style="${config.stringAxis}: ${STRING_Y_POSITIONS[posIdx]}px; ${config.stringThicknessProp}: ${STRING_THICKNESS[i]}px;"></div>`;
  }
  return html;
}

/** Remove any fret-range hover box from the given fretboard element. */
export function hideFretRangeBox(fretboard: HTMLElement): void {
  fretboard.querySelector(".position-hover-box")?.remove();
}

/**
 * Draw a bounding box spanning frets [startFret, endFret] across all strings
 * of the given fretboard element. Replaces any existing box.
 */
export function showFretRangeBox(
  fretboard: HTMLElement,
  startFret: number,
  endFret: number,
  color: string,
  config: LayoutConfig,
): void {
  hideFretRangeBox(fretboard);

  const clampedEnd = Math.min(endFret, TOTAL_FRETS);
  // Align box edges with the note centres at the start/end frets.
  const startPos =
    startFret === 0
      ? 0
      : NUT_POSITION + (startFret - 1) * FRET_WIDTH + FRET_WIDTH / 2;
  const endPos = NUT_POSITION + (clampedEnd - 1) * FRET_WIDTH + FRET_WIDTH / 2;

  const box = document.createElement("div");
  box.className = "position-hover-box";
  box.style[config.fretAxis] = `${startPos}px`;
  box.style[config.fretDimension] = `${endPos - startPos}px`;
  box.style.borderColor = color;
  fretboard.appendChild(box);
}

export function generateFretNumbersHTML(): string {
  let numbersHTML = '<div class="fret-number">Open</div>';
  for (let fret = 1; fret <= TOTAL_FRETS; fret++) {
    let markerClass = "";
    if (SINGLE_DOT_FRETS.includes(fret)) {
      markerClass = "marker-single";
    } else if (DOUBLE_DOT_FRETS.includes(fret)) {
      markerClass = "marker-double";
    }
    numbersHTML += `<div class="fret-number ${markerClass}">${fret}</div>`;
  }
  return numbersHTML;
}
