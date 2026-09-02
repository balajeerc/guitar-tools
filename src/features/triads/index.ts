import type { ScaleType } from "../../shared/types";
import { NOTES } from "../../shared/constants";
import { observeFretboardResize } from "../../shared/layout";
import { setupAccordionToggle } from "../../shared/accordion";
import { setButtonActive } from "../../shared/dom";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { renderTriads } from "./renderer";
import { renderTriadsPageTemplate } from "./template";

interface TriadsState {
  rootIndex: number;
  scaleType: ScaleType;
  showOrbit: boolean;
}

const STORAGE_KEY = "triads-state";
const DEFAULTS: TriadsState = { rootIndex: 3, scaleType: "major", showOrbit: false };
let state: TriadsState = { ...DEFAULTS };

function updateDisplay(): void {
  const currentNote = document.getElementById("triadsCurrentNote");
  const summary = document.getElementById("triadsControlsSummary");
  if (currentNote) currentNote.textContent = NOTES[state.rootIndex];
  if (summary) {
    summary.textContent =
      `${NOTES[state.rootIndex]} ${state.scaleType === "major" ? "Major" : "Minor"}${state.showOrbit ? " · Orbit" : ""}`;
  }
  setButtonActive("triadsMajorBtn", state.scaleType === "major");
  setButtonActive("triadsMinorBtn", state.scaleType === "minor");
  setButtonActive("triadsOrbitOffBtn", !state.showOrbit);
  setButtonActive("triadsOrbitOnBtn", state.showOrbit);
  document.getElementById("triadsOrbitOffBtn")?.setAttribute("aria-pressed", String(!state.showOrbit));
  document.getElementById("triadsOrbitOnBtn")?.setAttribute("aria-pressed", String(state.showOrbit));
  renderTriads(state.rootIndex, state.scaleType, state.showOrbit);
  savePersisted(STORAGE_KEY, state);
}

function moveRoot(direction: -1 | 1): void {
  state = { ...state, rootIndex: (state.rootIndex + direction + NOTES.length) % NOTES.length };
  updateDisplay();
}

function setupControls(): void {
  document.getElementById("triadsPrevNote")?.addEventListener("click", () => moveRoot(-1));
  document.getElementById("triadsNextNote")?.addEventListener("click", () => moveRoot(1));
  document.getElementById("triadsMajorBtn")?.addEventListener("click", () => {
    state = { ...state, scaleType: "major" };
    updateDisplay();
  });
  document.getElementById("triadsMinorBtn")?.addEventListener("click", () => {
    state = { ...state, scaleType: "minor" };
    updateDisplay();
  });
  document.getElementById("triadsOrbitOffBtn")?.addEventListener("click", () => {
    state = { ...state, showOrbit: false };
    updateDisplay();
  });
  document.getElementById("triadsOrbitOnBtn")?.addEventListener("click", () => {
    state = { ...state, showOrbit: true };
    updateDisplay();
  });
  document.addEventListener("keydown", (event) => {
    const page = document.getElementById("triads-page");
    if (!page || page.style.display === "none") return;
    if (event.key === "ArrowLeft") moveRoot(-1);
    if (event.key === "ArrowRight") moveRoot(1);
  });
}

function resetState(): void {
  state = { ...DEFAULTS };
  updateDisplay();
}

export function initTriadsFeature(): void {
  const page = document.getElementById("triads-page");
  if (!page) return;
  state = { ...DEFAULTS, ...loadPersisted(STORAGE_KEY, DEFAULTS) };
  page.innerHTML = renderTriadsPageTemplate();
  setupControls();
  setupAccordionToggle("triadsAccordionToggle");
  document.getElementById("triadsControlsPanel")?.appendChild(createResetLink(resetState));
  observeFretboardResize(updateDisplay);
  updateDisplay();
}
