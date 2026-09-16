import type { ScaleType } from "../../shared/types";
import { NOTES } from "../../shared/constants";
import { observeFretboardResize } from "../../shared/layout";
import { setupAccordionToggle } from "../../shared/accordion";
import { setButtonActive } from "../../shared/dom";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import {
  getProgressionChord,
  progressionStepLabel,
  type ProgressionDegree,
  type ProgressionChord,
  type ProgressionStep,
} from "./grouping";
import { renderTriads } from "./renderer";
import { renderTriadsPageTemplate } from "./template";

type TriadsViewMode = "static" | "groupings";

interface TriadsState {
  rootIndex: number;
  scaleType: ScaleType;
  showOrbit: boolean;
  viewMode: TriadsViewMode;
  progression: ProgressionStep[];
}

const STORAGE_KEY = "triads-state";
const STEP_DURATION_MS = 2000;
const INACTIVITY_RESUME_MS = 60_000;

function createDefaultState(): TriadsState {
  return {
    rootIndex: 3,
    scaleType: "major",
    showOrbit: false,
    viewMode: "static",
    progression: [
      { degree: 1, quality: "major" },
      { degree: 4, quality: "major" },
      { degree: 5, quality: "major" },
      { degree: 1, quality: "major" },
    ],
  };
}

let state = createDefaultState();
let activeStepIndex = 0;
let animationTimer: number | null = null;
let resumeTimer: number | null = null;

function getChords(): ProgressionChord[] {
  return state.progression.map((step) =>
    getProgressionChord(state.rootIndex, state.scaleType, step));
}

function scaleLabel(): string {
  return state.scaleType === "major" ? "Major" : "Minor";
}

function updateSummary(isGrouping: boolean): void {
  const summary = document.getElementById("triadsControlsSummary");
  if (!summary) return;
  const orbit = state.showOrbit ? " · Orbit" : "";
  const base = `${NOTES[state.rootIndex]} ${scaleLabel()}`;
  if (!isGrouping) {
    summary.textContent = `${base}${orbit}`;
    return;
  }
  const progression = state.progression.map(progressionStepLabel).join("–");
  summary.textContent = `${base} · ${progression} · Groupings${orbit}`;
}

function setPressed(id: string, pressed: boolean): void {
  setButtonActive(id, pressed);
  document.getElementById(id)?.setAttribute("aria-pressed", String(pressed));
}

function updateToggleControls(isGrouping: boolean): void {
  setPressed("triadsMajorBtn", state.scaleType === "major");
  setPressed("triadsMinorBtn", state.scaleType === "minor");
  setPressed("triadsOrbitOffBtn", !state.showOrbit);
  setPressed("triadsOrbitOnBtn", state.showOrbit);
  setPressed("triadsStaticViewBtn", !isGrouping);
  setPressed("triadsGroupingsViewBtn", isGrouping);
}

function updateProgressionControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-progression-degree]")) {
    const index = Number(button.dataset.progressionDegree);
    button.textContent = progressionStepLabel(state.progression[index]);
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-progression-quality]")) {
    const index = Number(button.dataset.progressionQuality);
    const quality = state.progression[index].quality;
    const isMinor = quality === "minor";
    button.textContent = isMinor ? "minor" : "Major";
    button.classList.toggle("is-minor", isMinor);
    button.setAttribute("aria-label", `Make progression step ${index + 1} ${isMinor ? "major" : "minor"}`);
  }
}

function updateStepStatus(): void {
  const status = document.getElementById("triadsStepStatus");
  const activeChord = document.getElementById("triadsActiveChord");
  const isGrouping = state.viewMode === "groupings";
  if (status) {
    status.hidden = !isGrouping;
    status.classList.toggle("is-paused", isGrouping && animationTimer === null);
  }
  const chord = getChords()[activeStepIndex];
  if (activeChord && chord) {
    const quality = chord.quality[0].toUpperCase() + chord.quality.slice(1);
    activeChord.textContent = `${progressionStepLabel(chord)} · ${NOTES[chord.rootIndex]} ${quality}`;
  }
  for (const dash of document.querySelectorAll<HTMLButtonElement>("[data-triad-step]")) {
    const index = Number(dash.dataset.triadStep);
    const isActive = index === activeStepIndex;
    dash.classList.toggle("active", isActive);
    dash.setAttribute("aria-current", isActive ? "step" : "false");
  }
}

function updateDisplay(persist = true): void {
  const currentNote = document.getElementById("triadsCurrentNote");
  const progressionControls = document.getElementById("triadsProgressionControls");
  const isGrouping = state.viewMode === "groupings";
  if (currentNote) currentNote.textContent = NOTES[state.rootIndex];
  if (progressionControls) progressionControls.hidden = !isGrouping;
  updateSummary(isGrouping);
  updateToggleControls(isGrouping);
  updateProgressionControls();
  updateStepStatus();
  renderTriads(
    state.rootIndex,
    state.scaleType,
    state.showOrbit,
    isGrouping ? { chords: getChords(), activeStepIndex } : undefined,
  );
  if (persist) savePersisted(STORAGE_KEY, state);
}

function clearPlaybackTimers(): void {
  if (animationTimer !== null) window.clearInterval(animationTimer);
  if (resumeTimer !== null) window.clearTimeout(resumeTimer);
  animationTimer = null;
  resumeTimer = null;
}

function startAutoplay(): void {
  clearPlaybackTimers();
  if (state.viewMode !== "groupings") return;
  animationTimer = window.setInterval(() => {
    activeStepIndex = (activeStepIndex + 1) % state.progression.length;
    updateDisplay(false);
  }, STEP_DURATION_MS);
  updateStepStatus();
}

function freezeAtStep(index: number): void {
  clearPlaybackTimers();
  activeStepIndex = index;
  updateDisplay(false);
  resumeTimer = window.setTimeout(startAutoplay, INACTIVITY_RESUME_MS);
}

function moveRoot(direction: -1 | 1): void {
  state = { ...state, rootIndex: (state.rootIndex + direction + NOTES.length) % NOTES.length };
  updateDisplay();
}

function setViewMode(viewMode: TriadsViewMode): void {
  if (state.viewMode === viewMode) return;
  clearPlaybackTimers();
  state = { ...state, viewMode };
  activeStepIndex = 0;
  updateDisplay();
  startAutoplay();
}

function updateProgressionStep(index: number, update: Partial<ProgressionStep>): void {
  state = {
    ...state,
    progression: state.progression.map((step, stepIndex) =>
      stepIndex === index ? { ...step, ...update } : step),
  };
  activeStepIndex = index;
  updateDisplay();
  startAutoplay();
}

function setupProgressionControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-progression-degree]")) {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.progressionDegree);
      const currentDegree = state.progression[index].degree;
      const degree = (currentDegree % 7 + 1) as ProgressionDegree;
      updateProgressionStep(index, { degree });
    });
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-progression-quality]")) {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.progressionQuality);
      const quality = state.progression[index].quality === "minor" ? "major" : "minor";
      updateProgressionStep(index, { quality });
    });
  }
  for (const dash of document.querySelectorAll<HTMLButtonElement>("[data-triad-step]")) {
    dash.addEventListener("click", () => freezeAtStep(Number(dash.dataset.triadStep)));
  }
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
  document.getElementById("triadsStaticViewBtn")?.addEventListener("click", () => setViewMode("static"));
  document.getElementById("triadsGroupingsViewBtn")?.addEventListener("click", () => setViewMode("groupings"));
  setupProgressionControls();
  document.addEventListener("keydown", (event) => {
    const page = document.getElementById("triads-page");
    if (!page || page.style.display === "none") return;
    if (event.key === "ArrowLeft") moveRoot(-1);
    if (event.key === "ArrowRight") moveRoot(1);
  });
}

function resetState(): void {
  clearPlaybackTimers();
  state = createDefaultState();
  activeStepIndex = 0;
  updateDisplay();
}

function loadState(): TriadsState {
  const defaults = createDefaultState();
  const persisted = loadPersisted<Partial<TriadsState>>(STORAGE_KEY, defaults);
  const progression = Array.isArray(persisted.progression) && persisted.progression.length === 4
    ? persisted.progression
    : defaults.progression;
  return { ...defaults, ...persisted, progression };
}

export function initTriadsFeature(): void {
  const page = document.getElementById("triads-page");
  if (!page) return;
  state = loadState();
  page.innerHTML = renderTriadsPageTemplate();
  setupControls();
  setupAccordionToggle("triadsAccordionToggle");
  document.getElementById("triadsControlsPanel")?.appendChild(createResetLink(resetState));
  observeFretboardResize(() => updateDisplay(false));
  updateDisplay();
  startAutoplay();
}
