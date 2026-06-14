// Common fretboard rendering functions

import {
  TOTAL_FRETS,
  NUT_POSITION,
  FRET_WIDTH,
  STRING_Y_POSITIONS,
  STRING_THICKNESS,
  SINGLE_DOT_FRETS,
  DOUBLE_DOT_FRETS,
} from "./constants";
import type { LayoutConfig } from "./layout";

/** Pixel position (along the fret axis) of a note centred on the given fret. */
export function fretCenterPosition(fret: number): number {
  return fret === 0 ? NUT_POSITION / 2 : NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
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
