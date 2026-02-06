import type { ScaleType, DisplayMode, HighlightMode } from "../../shared/types";
import {
  renderCAGEDHeader,
  renderFretboard,
  updateNoteDisplay,
} from "./renderer";

// Application state
let currentRootIndex: number = 3; // Start with C (matches the image)
let currentScale: ScaleType = "major";
let displayMode: DisplayMode = "notes";
let highlightMode: HighlightMode = "caged";

/**
 * Update all display elements based on current state
 */
function updateDisplay(): void {
  updateNoteDisplay(currentRootIndex);
  renderCAGEDHeader(currentRootIndex, highlightMode);
  renderFretboard(currentRootIndex, currentScale, displayMode, highlightMode);
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
  const cagedLegend = document.getElementById("cagedLegend");
  const pentatonicLegend = document.getElementById("pentatonicLegend");

  if (
    !cagedHighlightBtn ||
    !pentatonicHighlightBtn ||
    !cagedLegend ||
    !pentatonicLegend
  ) {
    return;
  }

  cagedHighlightBtn.addEventListener("click", () => {
    highlightMode = "caged";
    cagedHighlightBtn.classList.add("active");
    pentatonicHighlightBtn.classList.remove("active");
    cagedLegend.style.display = "flex";
    pentatonicLegend.style.display = "none";
    updateDisplay();
  });

  pentatonicHighlightBtn.addEventListener("click", () => {
    highlightMode = "pentatonic";
    pentatonicHighlightBtn.classList.add("active");
    cagedHighlightBtn.classList.remove("active");
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
  setupNoteNavigation();
  setupScaleTypeButtons();
  setupDisplayModeButtons();
  setupHighlightModeToggle();
  setupKeyboardNavigation();

  // Initial render
  updateDisplay();
}
