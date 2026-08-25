import type { ScaleType, DisplayMode, HighlightMode } from "../../shared/types";
import {
  renderCAGEDHeader,
  renderFretboard,
  updateNoteDisplay,
} from "./renderer";
import { observeFretboardResize } from "../../shared/layout";
import { NOTES } from "../../shared/constants";
import { setupAccordionToggle } from "../../shared/accordion";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { setButtonActive } from "../../shared/dom";

interface ScalesState {
  rootIndex: number;
  scale: ScaleType;
  displayMode: DisplayMode;
  highlightMode: HighlightMode;
}

const STORAGE_KEY = "scales-state";
const DEFAULTS: ScalesState = {
  rootIndex: 3, // C (matches the image)
  scale: "major",
  displayMode: "intervals",
  highlightMode: "caged",
};

// Application state
let currentRootIndex: number = DEFAULTS.rootIndex;
let currentScale: ScaleType = DEFAULTS.scale;
let displayMode: DisplayMode = DEFAULTS.displayMode;
let highlightMode: HighlightMode = DEFAULTS.highlightMode;

function saveState(): void {
  savePersisted(STORAGE_KEY, {
    rootIndex: currentRootIndex,
    scale: currentScale,
    displayMode,
    highlightMode,
  } satisfies ScalesState);
}

function applyState(s: ScalesState): void {
  currentRootIndex = s.rootIndex;
  currentScale = s.scale;
  displayMode = s.displayMode;
  highlightMode = s.highlightMode;
}

/** Sync control buttons and legends to match current state */
function syncControls(): void {
  updateNoteDisplay(currentRootIndex);
  setButtonActive("majorBtn", currentScale === "major");
  setButtonActive("minorBtn", currentScale === "minor");
  setButtonActive("notesBtn", displayMode === "notes");
  setButtonActive("intervalsBtn", displayMode === "intervals");
  setButtonActive("cagedHighlightBtn", highlightMode === "caged");
  setButtonActive("pentatonicHighlightBtn", highlightMode === "pentatonic");
  setButtonActive("fullHighlightBtn", highlightMode === "full");

  const cagedLegend = document.getElementById("cagedLegend");
  const pentatonicLegend = document.getElementById("pentatonicLegend");
  if (cagedLegend)
    cagedLegend.style.display = highlightMode === "caged" ? "flex" : "none";
  if (pentatonicLegend)
    pentatonicLegend.style.display =
      highlightMode === "caged" ? "none" : "flex";
}

function resetState(): void {
  applyState(DEFAULTS);
  syncControls();
  updateDisplay();
}


function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function updateControlsSummary(): void {
  const summary = document.getElementById("controlsSummary");
  if (!summary) return;
  const note = NOTES[currentRootIndex];
  const scale = capitalize(currentScale);
  const display = capitalize(displayMode);
  const show = highlightMode === "caged" ? "CAGED" : capitalize(highlightMode);
  summary.textContent = `${note} ${scale} · ${display} · ${show}`;
}

function updateDisplay(): void {
  updateNoteDisplay(currentRootIndex);
  renderCAGEDHeader(currentRootIndex, highlightMode, currentScale);
  renderFretboard(currentRootIndex, currentScale, displayMode, highlightMode);
  updateControlsSummary();
  saveState();
}

function setupNoteNavigation(): void {
  const prevNoteBtn = document.getElementById("prevNote");
  const nextNoteBtn = document.getElementById("nextNote");

  prevNoteBtn?.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex - 1 + 12) % 12;
    updateDisplay();
  });

  nextNoteBtn?.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex + 1) % 12;
    updateDisplay();
  });
}

function setupScaleTypeButtons(): void {
  const majorBtn = document.getElementById("majorBtn");
  const minorBtn = document.getElementById("minorBtn");

  if (!majorBtn || !minorBtn) return;

  majorBtn.addEventListener("click", () => {
    currentScale = "major";
    majorBtn.classList.add("active");
    minorBtn.classList.remove("active");
    updateDisplay();
  });

  minorBtn.addEventListener("click", () => {
    currentScale = "minor";
    minorBtn.classList.add("active");
    majorBtn.classList.remove("active");
    updateDisplay();
  });
}

function setupDisplayModeButtons(): void {
  const notesBtn = document.getElementById("notesBtn");
  const intervalsBtn = document.getElementById("intervalsBtn");

  if (!notesBtn || !intervalsBtn) return;

  notesBtn.addEventListener("click", () => {
    displayMode = "notes";
    notesBtn.classList.add("active");
    intervalsBtn.classList.remove("active");
    updateDisplay();
  });

  intervalsBtn.addEventListener("click", () => {
    displayMode = "intervals";
    intervalsBtn.classList.add("active");
    notesBtn.classList.remove("active");
    updateDisplay();
  });
}

function setupHighlightModeToggle(): void {
  const cagedHighlightBtn = document.getElementById("cagedHighlightBtn");
  const pentatonicHighlightBtn = document.getElementById(
    "pentatonicHighlightBtn",
  );
  const fullHighlightBtn = document.getElementById("fullHighlightBtn");
  const cagedLegend = document.getElementById("cagedLegend");
  const pentatonicLegend = document.getElementById("pentatonicLegend");

  if (
    !cagedHighlightBtn ||
    !pentatonicHighlightBtn ||
    !fullHighlightBtn ||
    !cagedLegend ||
    !pentatonicLegend
  ) {
    return;
  }

  const allBtns = [cagedHighlightBtn, pentatonicHighlightBtn, fullHighlightBtn];
  function setActiveBtn(activeBtn: HTMLElement): void {
    for (const btn of allBtns) btn.classList.remove("active");
    activeBtn.classList.add("active");
  }

  cagedHighlightBtn.addEventListener("click", () => {
    highlightMode = "caged";
    setActiveBtn(cagedHighlightBtn);
    cagedLegend.style.display = "flex";
    pentatonicLegend.style.display = "none";
    updateDisplay();
  });

  pentatonicHighlightBtn.addEventListener("click", () => {
    highlightMode = "pentatonic";
    setActiveBtn(pentatonicHighlightBtn);
    cagedLegend.style.display = "none";
    pentatonicLegend.style.display = "flex";
    updateDisplay();
  });

  fullHighlightBtn.addEventListener("click", () => {
    highlightMode = "full";
    setActiveBtn(fullHighlightBtn);
    cagedLegend.style.display = "none";
    pentatonicLegend.style.display = "flex";
    updateDisplay();
  });
}

function setupKeyboardNavigation(): void {
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const page = document.getElementById("scales-page");
    if (page && page.style.display === "none") return;

    if (e.key === "ArrowLeft") {
      currentRootIndex = (currentRootIndex - 1 + 12) % 12;
      updateDisplay();
    } else if (e.key === "ArrowRight") {
      currentRootIndex = (currentRootIndex + 1) % 12;
      updateDisplay();
    }
  });
}

export function initScalesFeature(): void {
  applyState(loadPersisted(STORAGE_KEY, DEFAULTS));

  setupNoteNavigation();
  setupScaleTypeButtons();
  setupDisplayModeButtons();
  setupHighlightModeToggle();
  setupKeyboardNavigation();
  setupAccordionToggle("controlsAccordionToggle");

  document
    .getElementById("controlsPanel")
    ?.appendChild(createResetLink(resetState));

  // Reflect persisted state in the controls before first render
  syncControls();

  observeFretboardResize(updateDisplay);

  // Initial render
  updateDisplay();
}
