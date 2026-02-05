import type { ScaleType, DisplayMode } from "../../shared/types";
import {
  renderCAGEDHeader,
  renderFretboard,
  updateNoteDisplay,
} from "./renderer";

// Application state
let currentRootIndex: number = 3; // Start with C (matches the image)
let currentScale: ScaleType = "major";
let displayMode: DisplayMode = "notes";

/**
 * Update all display elements based on current state
 */
function updateDisplay(): void {
  updateNoteDisplay(currentRootIndex);
  renderCAGEDHeader(currentRootIndex);
  renderFretboard(currentRootIndex, currentScale, displayMode);
}

export function initScalesFeature(): void {
  // Note navigation buttons
  const prevNoteBtn = document.getElementById("prevNote");
  if (prevNoteBtn) {
    prevNoteBtn.addEventListener("click", () => {
      currentRootIndex = (currentRootIndex - 1 + 12) % 12;
      updateDisplay();
    });
  }

  const nextNoteBtn = document.getElementById("nextNote");
  if (nextNoteBtn) {
    nextNoteBtn.addEventListener("click", () => {
      currentRootIndex = (currentRootIndex + 1) % 12;
      updateDisplay();
    });
  }

  // Scale type buttons
  const majorBtn = document.getElementById("majorBtn");
  const minorBtn = document.getElementById("minorBtn");

  if (majorBtn && minorBtn) {
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

  // Display mode buttons
  const notesBtn = document.getElementById("notesBtn");
  const intervalsBtn = document.getElementById("intervalsBtn");

  if (notesBtn && intervalsBtn) {
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

  // Keyboard navigation
  // Note: This might conflict if multiple features use arrow keys.
  // For now, we'll keep it but might need to scope it later.
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // Only handle if this page is visible?
    // For now, let's assume simple routing where we might not detach this.
    // Ideally we should return a cleanup function.
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

  // Initial render
  updateDisplay();
}
