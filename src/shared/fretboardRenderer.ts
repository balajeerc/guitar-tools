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

export function generateFretLinesHTML(): string {
  let html = "";
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const x = fret === 0 ? NUT_POSITION : NUT_POSITION + fret * FRET_WIDTH;
    const isNut = fret === 0;
    html += `<div class="fret-line ${isNut ? "nut" : ""}" style="left: ${x}px;"></div>`;
  }
  return html;
}

export function generateDotsHTML(): string {
  let html = "";
  for (const fret of SINGLE_DOT_FRETS) {
    const x = NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
    html += `<div class="fret-dot single" style="left: ${x}px;"></div>`;
  }

  for (const fret of DOUBLE_DOT_FRETS) {
    const x = NUT_POSITION + (fret - 0.5) * FRET_WIDTH;
    html += `<div class="fret-dot double-top" style="left: ${x}px;"></div>`;
    html += `<div class="fret-dot double-bottom" style="left: ${x}px;"></div>`;
  }
  return html;
}

export function generateStringsHTML(): string {
  let html = "";
  for (let i = 0; i < 6; i++) {
    html += `<div class="string-line" style="top: ${STRING_Y_POSITIONS[i]}px; height: ${STRING_THICKNESS[i]}px;"></div>`;
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
