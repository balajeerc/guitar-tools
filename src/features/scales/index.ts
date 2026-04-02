import type { ScaleType, DisplayMode, HighlightMode } from "../../shared/types";
import {
  renderCAGEDHeader,
  renderFretboard,
  updateNoteDisplay,
} from "./renderer";
import { MOBILE_BREAKPOINT } from "../../shared/layout";
import { NOTES } from "../../shared/constants";
import { setupAccordionToggle } from "../../shared/accordion";

// Application state
let currentRootIndex: number = 3; // Start with C (matches the image)
let currentScale: ScaleType = "major";
let displayMode: DisplayMode = "notes";
let highlightMode: HighlightMode = "caged";


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
    pentatonicLegend.style.display = "none";
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
  setupAccordionToggle("controlsAccordionToggle");

  // Re-render when crossing mobile breakpoint
  window
    .matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    .addEventListener("change", () => updateDisplay());

  // Initial render
  updateDisplay();
}
