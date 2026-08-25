// Common fretboard rendering functions

import {
  TOTAL_FRETS,
  STRING_Y_POSITIONS,
  STRING_THICKNESS,
  SINGLE_DOT_FRETS,
  DOUBLE_DOT_FRETS,
} from "./constants";
import type { LayoutConfig } from "./layout";

/** Pixel position (along the fret axis) of a note centred on the given fret. */
export function fretCenterPosition(
  fret: number,
  config: LayoutConfig,
): number {
  return fret === 0
    ? config.nutPosition / 2
    : config.nutPosition + (fret - 0.5) * config.fretWidth;
}

/**
 * Size a CAGED-style header element to align with the fretboard in the current
 * layout: a horizontal banner above the board, or a vertical sidebar beside it.
 */
export function sizeCagedHeader(header: HTMLElement, config: LayoutConfig): void {
  header.style.position = "relative";
  if (config.isVertical) {
    header.style.height = "";
    header.style.minWidth = "";
    header.style.minHeight = `${config.fretboardLength}px`;
    header.style.width = "60px";
  } else {
    header.style.height = "120px";
    header.style.minWidth =
      `${config.fretboardLength + config.fretboardContainerPadding}px`;
    header.style.minHeight = "";
    header.style.width = "";
  }
}

export function generateFretLinesHTML(config: LayoutConfig): string {
  let html = "";
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const pos =
      fret === 0
        ? config.nutPosition
        : config.nutPosition + fret * config.fretWidth;
    const isNut = fret === 0;
    html += `<div class="fret-line ${isNut ? "nut" : ""}" style="${config.fretAxis}: ${pos}px;"></div>`;
  }
  return html;
}

export function generateDotsHTML(config: LayoutConfig): string {
  let html = "";
  for (const fret of SINGLE_DOT_FRETS) {
    const pos = config.nutPosition + (fret - 0.5) * config.fretWidth;
    html += `<div class="fret-dot single" style="${config.fretAxis}: ${pos}px;"></div>`;
  }

  for (const fret of DOUBLE_DOT_FRETS) {
    const pos = config.nutPosition + (fret - 0.5) * config.fretWidth;
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

export function generateFretNumbersHTML(config: LayoutConfig): string {
  const openStyle = config.isVertical
    ? ""
    : ` style="width: ${config.nutPosition}px;"`;
  const fretStyle = config.isVertical
    ? ""
    : ` style="width: ${config.fretWidth}px;"`;
  let numbersHTML = `<div class="fret-number"${openStyle}>Open</div>`;
  for (let fret = 1; fret <= TOTAL_FRETS; fret++) {
    let markerClass = "";
    if (SINGLE_DOT_FRETS.includes(fret)) {
      markerClass = "marker-single";
    } else if (DOUBLE_DOT_FRETS.includes(fret)) {
      markerClass = "marker-double";
    }
    numbersHTML += `<div class="fret-number ${markerClass}"${fretStyle}>${fret}</div>`;
  }
  return numbersHTML;
}
