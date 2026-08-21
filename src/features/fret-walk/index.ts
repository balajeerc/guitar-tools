// Fret Walk feature: click any position to anchor a root, then see the notes
// from the previous root to the next root, filtered by a Major/Minor/Full scale.

import type { DisplayMode } from "../../shared/types";
import { MOBILE_BREAKPOINT } from "../../shared/layout";
import { setupAccordionToggle } from "../../shared/accordion";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { setButtonActive } from "../../shared/dom";
import { positionFromPoint } from "../../shared/fretboardPosition";
import {
  renderFretWalk,
  describeAnchor,
  anchorPitch,
  type Anchor,
  type FretWalkMode,
} from "./renderer";

interface FretWalkState {
  anchors: Anchor[];
  displayMode: DisplayMode;
  mode: FretWalkMode;
}

const STORAGE_KEY = "fret-walk-state";
const DEFAULTS: FretWalkState = {
  anchors: [],
  displayMode: "intervals",
  mode: "major",
};

let anchors: Anchor[] = [...DEFAULTS.anchors];
let displayMode: DisplayMode = DEFAULTS.displayMode;
let mode: FretWalkMode = DEFAULTS.mode;

const FRETBOARD_ID = "fret-walk-fretboard";

function saveState(): void {
  savePersisted(STORAGE_KEY, { anchors, displayMode, mode } satisfies FretWalkState);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Suffix noting how many extra octaves the walk has been extended by. */
function octaveSuffix(): string {
  return anchors.length > 1 ? ` (+${anchors.length - 1} oct)` : "";
}

function getControlsSummary(): string {
  if (anchors.length === 0) return "Click a note to walk from";
  const display = displayMode === "intervals" ? "Intervals" : "Notes";
  return `${describeAnchor(anchors[0])}${octaveSuffix()} · ${capitalize(mode)} · ${display}`;
}

function updateControlsSummary(): void {
  const summary = document.getElementById("fretWalkControlsSummary");
  if (summary) summary.textContent = getControlsSummary();
}

function updateAnchorInfo(): void {
  const info = document.getElementById("fretWalkInfo");
  if (!info) return;
  info.textContent =
    anchors.length === 0
      ? "Click anywhere on the fretboard to anchor a root — notes from that root up to the next root will appear. Click a top root to walk up another octave."
      : `Walking from: ${describeAnchor(anchors[0])}${octaveSuffix()}`;
}

function syncControls(): void {
  setButtonActive("fretWalkNotesBtn", displayMode === "notes");
  setButtonActive("fretWalkIntervalsBtn", displayMode === "intervals");
  setButtonActive("fretWalkMajorBtn", mode === "major");
  setButtonActive("fretWalkMinorBtn", mode === "minor");
  setButtonActive("fretWalkFullBtn", mode === "full");
}

function updateDisplay(): void {
  renderFretWalk(anchors, displayMode, mode);
  syncControls();
  updateControlsSummary();
  updateAnchorInfo();
  saveState();
}

function clearSelection(): void {
  if (anchors.length === 0) return;
  anchors = [];
  updateDisplay();
}

function setupDisplayModeButtons(): void {
  document.getElementById("fretWalkNotesBtn")?.addEventListener("click", () => {
    displayMode = "notes";
    updateDisplay();
  });
  document
    .getElementById("fretWalkIntervalsBtn")
    ?.addEventListener("click", () => {
      displayMode = "intervals";
      updateDisplay();
    });
}

function setupModeButtons(): void {
  document.getElementById("fretWalkMajorBtn")?.addEventListener("click", () => {
    mode = "major";
    updateDisplay();
  });
  document.getElementById("fretWalkMinorBtn")?.addEventListener("click", () => {
    mode = "minor";
    updateDisplay();
  });
  document.getElementById("fretWalkFullBtn")?.addEventListener("click", () => {
    mode = "full";
    updateDisplay();
  });
}

/**
 * Handle clicks on the fretboard. Since the board is blank until an anchor is
 * set (and notes have pointer-events disabled), clicks are resolved to the
 * nearest string/fret position from the pointer coordinates.
 *
 * Behaviour:
 * - No selection → the clicked position becomes the first anchor.
 * - Clicking an existing anchor → truncates the walk to just before it
 *   (clicking the first anchor clears everything).
 * - Clicking a terminating root (an octave above the last anchor) → extends the
 *   walk additively by another octave.
 * - Clicking anywhere else → starts a fresh walk from that position.
 */
function setupFretboardClicks(): void {
  const fretboard = document.getElementById(FRETBOARD_ID);
  if (!fretboard) return;

  fretboard.addEventListener("click", (e: MouseEvent) => {
    const pos = positionFromPoint(e.clientX, e.clientY, fretboard);
    if (!pos) return;

    if (anchors.length === 0) {
      anchors = [pos];
      updateDisplay();
      return;
    }

    // Clicking an existing anchor truncates the walk to before it.
    const idx = anchors.findIndex(
      (a) => a.stringIdx === pos.stringIdx && a.fret === pos.fret,
    );
    if (idx !== -1) {
      anchors = anchors.slice(0, idx);
      updateDisplay();
      return;
    }

    // Clicking the terminating (octave-up) root extends the walk additively.
    const last = anchors[anchors.length - 1];
    if (anchorPitch(pos) === anchorPitch(last) + 12) {
      anchors = [...anchors, pos];
      updateDisplay();
      return;
    }

    // Otherwise start a fresh walk.
    anchors = [pos];
    updateDisplay();
  });
}

/**
 * Clicking anywhere outside the fretboard and its controls clears the whole
 * selection (equivalent to a reset of the walk).
 */
function setupOutsideClick(): void {
  document.addEventListener("click", (e: MouseEvent) => {
    if (anchors.length === 0) return;

    const page = document.getElementById("fret-walk-page");
    // Ignore while the Fret Walk page isn't the visible route.
    if (!page || page.style.display === "none") return;

    const target = e.target as Node | null;
    if (!target) return;

    const insideBoard = page
      .querySelector(".fretboard-container")
      ?.contains(target);
    const insideControls = page
      .querySelector(".controls-wrapper")
      ?.contains(target);
    if (insideBoard || insideControls) return;

    clearSelection();
  });
}

function resetState(): void {
  anchors = [...DEFAULTS.anchors];
  displayMode = DEFAULTS.displayMode;
  mode = DEFAULTS.mode;
  updateDisplay();
}

/**
 * Initialize the Fret Walk feature.
 */
export function initFretWalkFeature(): void {
  const container = document.getElementById("fret-walk-page");
  if (!container) return;

  const persisted = loadPersisted<FretWalkState>(STORAGE_KEY, DEFAULTS);
  anchors = Array.isArray(persisted.anchors) ? persisted.anchors : [];
  displayMode = persisted.displayMode;
  mode = persisted.mode;

  container.innerHTML = `
    <div class="controls-wrapper">
      <button class="controls-accordion-toggle" id="fretWalkAccordionToggle">
        <span class="controls-summary" id="fretWalkControlsSummary">${getControlsSummary()}</span>
        <span class="controls-accordion-arrow">&#9662;</span>
      </button>
      <div class="controls" id="fretWalk-controls">
        <div class="controls-row">
          <div class="control-group">
            <span class="control-label">Scale:</span>
            <div class="toggle-group">
              <button class="toggle-btn active" id="fretWalkMajorBtn">Major</button>
              <button class="toggle-btn" id="fretWalkMinorBtn">Minor</button>
              <button class="toggle-btn" id="fretWalkFullBtn">Full</button>
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">Display:</span>
            <div class="toggle-group">
              <button class="toggle-btn" id="fretWalkNotesBtn">Notes</button>
              <button class="toggle-btn active" id="fretWalkIntervalsBtn">Intervals</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chord-info" id="fretWalkInfo"></div>

    <div class="fretboard-section fret-walk-board">
      <div class="caged-header" id="fret-walk-header">
        <!-- Dynamically populated -->
      </div>
      <div class="fretboard-container">
        <div class="fretboard" id="fret-walk-fretboard">
          <!-- Dynamically populated -->
        </div>
        <div class="fret-numbers" id="fret-walk-fretNumbers">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("fretWalk-controls")
    ?.appendChild(createResetLink(resetState));

  setupDisplayModeButtons();
  setupModeButtons();
  setupFretboardClicks();
  setupOutsideClick();
  setupAccordionToggle("fretWalkAccordionToggle");

  // Re-render when crossing the mobile breakpoint.
  window
    .matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    .addEventListener("change", () => updateDisplay());

  // Initial render.
  updateDisplay();
}
