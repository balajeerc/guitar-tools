import { setButtonActive } from "../../shared/dom";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import {
  clampBpm,
  LARGE_BPM_STEP,
  SMALL_BPM_STEP,
} from "../metronome/beats";
import { beatsPanelHtml } from "./panel";
import { setupLoopLibrary } from "./loopLibrary";
import type { BeatLoopState, SavedBeatLoop } from "./loops";
import {
  createDefaultPattern,
  DEFAULT_LEVELS,
  DRUM_VOICES,
  normalizeLevels,
  normalizePattern,
  type DrumVoice,
} from "./pattern";
import { createBeatsPlayback, type BeatsPlayback } from "./playback";
import { highlightGridStep, updateBeatCell } from "./renderer";

const STORAGE_KEY = "beats-state";
const DEFAULT_BPM = 100;

let state = createDefaultState();
let running = false;
let playback: BeatsPlayback | null = null;
let activeLoopId = "";

function createDefaultState(): BeatLoopState {
  return {
    bpm: DEFAULT_BPM,
    pattern: createDefaultPattern(),
    levels: { ...DEFAULT_LEVELS },
  };
}

function getInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function saveState(): void {
  savePersisted(STORAGE_KEY, state);
}

function updateTempoDisplay(): void {
  const field = getInput("beatsBpmValue");
  if (field && document.activeElement !== field) field.value = String(state.bpm);
  const slider = getInput("beatsBpmSlider");
  if (slider) slider.value = String(state.bpm);
  saveState();
}

function setBpm(bpm: number): void {
  state.bpm = clampBpm(bpm);
  updateTempoDisplay();
}

function setupStepButton(id: string, delta: number): void {
  document
    .getElementById(id)
    ?.addEventListener("click", () => setBpm(state.bpm + delta));
}

function commitBpmField(field: HTMLInputElement): void {
  const bpm = Number.parseInt(field.value, 10);
  if (!Number.isNaN(bpm)) setBpm(bpm);
  field.value = String(state.bpm);
}

function setupTempoControls(): void {
  setupStepButton("beatsBpmDownLarge", -LARGE_BPM_STEP);
  setupStepButton("beatsBpmDown", -SMALL_BPM_STEP);
  setupStepButton("beatsBpmUp", SMALL_BPM_STEP);
  setupStepButton("beatsBpmUpLarge", LARGE_BPM_STEP);
  getInput("beatsBpmSlider")?.addEventListener("input", (event) => {
    setBpm(Number((event.target as HTMLInputElement).value));
  });
  const field = getInput("beatsBpmValue");
  field?.addEventListener("focus", () => field.select());
  field?.addEventListener("blur", () => commitBpmField(field));
  field?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") field.blur();
  });
}

function isDrumVoice(value: string | undefined): value is DrumVoice {
  return (DRUM_VOICES as readonly (string | undefined)[]).includes(value);
}

function toggleCell(grid: HTMLElement, cell: HTMLElement): void {
  const voice = cell.dataset.voice;
  const step = Number(cell.dataset.step);
  if (!isDrumVoice(voice) || !Number.isInteger(step)) return;
  const active = !state.pattern[voice][step];
  state.pattern[voice][step] = active;
  updateBeatCell(grid, voice, step, active);
  saveState();
}

function setTrackLevel(input: HTMLInputElement): void {
  const voice = input.dataset.level;
  if (!isDrumVoice(voice)) return;
  state.levels[voice] = Number(input.value);
  saveState();
}

function setupGrid(grid: HTMLElement): void {
  grid.addEventListener("click", (event) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      ".beats-cell",
    );
    if (cell) toggleCell(grid, cell);
  });
  grid.addEventListener("input", (event) => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>(
      ".beats-level",
    );
    if (input) setTrackLevel(input);
  });
}

function updateRunningDisplay(): void {
  setButtonActive("beatsToggleBtn", running);
  const button = document.getElementById("beatsToggleBtn");
  if (button) button.textContent = running ? "Stop" : "Start";
}

async function togglePlayback(): Promise<void> {
  if (!playback) return;
  if (running) {
    playback.stop();
    running = false;
  } else {
    await playback.start();
    running = true;
  }
  updateRunningDisplay();
}

function resetState(container: HTMLElement): void {
  stopPlayback();
  activeLoopId = "";
  state = createDefaultState();
  renderFeature(container);
}

function stopPlayback(): void {
  if (!running) return;
  playback?.stop();
  running = false;
}

function loadLoop(container: HTMLElement, loop: SavedBeatLoop): void {
  stopPlayback();
  activeLoopId = loop.id;
  state = {
    bpm: clampBpm(loop.bpm),
    pattern: normalizePattern(loop.pattern),
    levels: normalizeLevels(loop.levels),
  };
  renderFeature(container);
}

function setupRouteStop(): void {
  window.addEventListener("hashchange", () => {
    if (running && window.location.hash.slice(1) !== "beats") {
      void togglePlayback();
    }
  });
}

function setupFeatureElements(container: HTMLElement): void {
  const grid = document.getElementById("beatsGrid");
  if (!grid) return;
  playback = createBeatsPlayback(
    () => state,
    (step) => highlightGridStep(grid, step),
  );
  setupTempoControls();
  setupGrid(grid);
  setupLoopLibrary({
    getCurrentState: () => state,
    onLoad: (loop) => loadLoop(container, loop),
    initialSelectedId: activeLoopId,
  });
  document.getElementById("beatsToggleBtn")?.addEventListener("click", () => {
    void togglePlayback();
  });
  document
    .getElementById("beatsReset")
    ?.appendChild(createResetLink(() => resetState(container)));
  updateRunningDisplay();
}

function renderFeature(container: HTMLElement): void {
  container.innerHTML = beatsPanelHtml(state.bpm, state.pattern, state.levels);
  setupFeatureElements(container);
  updateTempoDisplay();
}

export function initBeatsFeature(): void {
  const container = document.getElementById("beats-page");
  if (!container) return;
  const persisted = loadPersisted<BeatLoopState>(STORAGE_KEY, createDefaultState());
  state = {
    bpm: clampBpm(persisted.bpm),
    pattern: normalizePattern(persisted.pattern),
    levels: normalizeLevels(persisted.levels),
  };
  renderFeature(container);
  setupRouteStop();
}
