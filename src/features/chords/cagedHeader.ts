// CAGED shape header for the Chords feature: shows the five moveable shape
// regions above the fretboard and draws a bounding box around a region's notes
// when its label is hovered.

import type { CAGEDShape } from "../../shared/types";
import {
  TOTAL_FRETS,
  NUT_POSITION,
  FRET_WIDTH,
  LINE_COLORS,
} from "../../shared/constants";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";
import { getChordShapeBoxes } from "../../shared/cagedShapes";
import {
  showFretRangeBox,
  hideFretRangeBox,
} from "../../shared/fretboardRenderer";
import { getChordType, getChordToneDegree } from "./chordTypes";

const HEADER_ID = "chordsCagedHeader";
const FRETBOARD_ID = "fretboard-chords";

/** Pixel position (fret axis) of the centre of a shape region's notes. */
function regionLabelPosition(startFret: number, endFret: number): number {
  const span = endFret - startFret + 1;
  const centerFret = startFret + (span - 1) / 2;
  return startFret === 0
    ? NUT_POSITION * 0.5 + (FRET_WIDTH * (span - 1)) / 2
    : NUT_POSITION + (centerFret - 0.5) * FRET_WIDTH;
}

/** Size the header element to align with the fretboard in the current layout. */
function sizeHeader(header: HTMLElement, config: LayoutConfig): void {
  header.style.position = "relative";
  if (config.isVertical) {
    header.style.minHeight = `${NUT_POSITION + TOTAL_FRETS * FRET_WIDTH}px`;
    header.style.width = "60px";
    header.style.height = "";
    header.style.minWidth = "";
  } else {
    header.style.height = "120px";
    header.style.minWidth = "1400px";
    header.style.minHeight = "";
    header.style.width = "";
  }
}

function attachHoverListeners(header: HTMLElement, config: LayoutConfig): void {
  const fretboard = document.getElementById(FRETBOARD_ID);
  if (!fretboard) return;

  for (const label of header.querySelectorAll<HTMLElement>(".shape-label")) {
    const shape = label.dataset.shape as CAGEDShape;
    const startFret = Number(label.dataset.startFret);
    const endFret = Number(label.dataset.endFret);
    const color = LINE_COLORS[shape];

    label.addEventListener("mouseenter", () =>
      showFretRangeBox(fretboard, startFret, endFret, color, config),
    );
    label.addEventListener("mouseleave", () => hideFretRangeBox(fretboard));
  }
}

/**
 * Render the CAGED shape labels above the chords fretboard and wire up the
 * hover bounding box.
 */
export function renderChordCagedHeader(
  rootIndex: number,
  chordTypeId: string,
): void {
  const header = document.getElementById(HEADER_ID);
  if (!header) return;

  const config = getLayoutConfig();
  sizeHeader(header, config);

  const chord = getChordType(chordTypeId);
  const isChordTone = (noteIndex: number): boolean =>
    getChordToneDegree(chord, noteIndex, rootIndex) !== null;

  const boxes = getChordShapeBoxes(rootIndex, isChordTone, TOTAL_FRETS);
  header.innerHTML = boxes
    .map(({ shape, startFret, endFret }) => {
      const pos = regionLabelPosition(startFret, endFret);
      return `
        <div class="shape-label" style="position: absolute; ${config.fretAxis}: ${pos}px;" data-shape="${shape}" data-start-fret="${startFret}" data-end-fret="${endFret}">
          <span class="shape-letter">${shape}</span>
          <span class="shape-text">shape</span>
          <div class="shape-line" style="background-color: ${LINE_COLORS[shape]};"></div>
        </div>`;
    })
    .join("");

  attachHoverListeners(header, config);
}
