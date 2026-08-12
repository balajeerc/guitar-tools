// Metronome feature: tempo, meter with per-beat accents, subdivisions,
// tap tempo and a swinging pendulum.

import { setupAccordionToggle } from "../../shared/accordion";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { setButtonActive } from "../../shared/dom";
import {
  clampBeats,
  clampBpm,
  defaultAccents,
  nextAccent,
  resizeAccents,
  LARGE_BPM_STEP,
  SMALL_BPM_STEP,
  SUBDIVISIONS,
  type AccentLevel,
} from "./beats";
import { metronomePanelHtml } from "./panel";
import { createPlayback, type Playback } from "./playback";
import { highlightBeat, renderBeatDots, setPendulumAngle } from "./visuals";

interface MetronomeState {
  bpm: number;
  beats: number;
  subdivisions: number;
  accents: AccentLevel[];
}

const STORAGE_KEY = "metronome-state";
const DEFAULTS: MetronomeState = {
  bpm: 100,
  beats: 4,
  subdivisions: 1,
  accents: defaultAccents(4),
};

let state: MetronomeState = { ...DEFAULTS };
let running = false;
let playback: Playback | null = null;

function saveState(): void {
  savePersisted(STORAGE_KEY, state);
}

function getSummary(): string {
  const sub = state.subdivisions > 1 ? ` · ÷${state.subdivisions}` : "";
  return `${state.bpm} BPM · ${state.beats}/4${sub}`;
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getInput(id: string): HTMLInputElement | null {
  return document.getElementById(id) as HTMLInputElement | null;
}

function updateDisplay(): void {
  setText("metronomeControlsSummary", getSummary());
  setText("metronomeBeatsDisplay", String(state.beats));

  const bpmField = getInput("metronomeBpmValue");
  // Don't fight the user while they're mid-edit in the BPM field.
  if (bpmField && document.activeElement !== bpmField) {
    bpmField.value = String(state.bpm);
  }

  const slider = getInput("metronomeBpmSlider");
  if (slider) slider.value = String(state.bpm);

  for (const { value } of SUBDIVISIONS) {
    setButtonActive(`metronomeSubdiv${value}Btn`, state.subdivisions === value);
  }

  const beatsEl = document.getElementById("metronomeBeats");
  if (beatsEl) renderBeatDots(beatsEl, state.accents);

  setButtonActive("metronomeToggleBtn", running);
  setText("metronomeToggleBtn", running ? "Stop" : "Start");
  saveState();
}

function setBpm(bpm: number): void {
  state.bpm = clampBpm(bpm);
  updateDisplay();
}

function setBeats(beats: number): void {
  state.beats = clampBeats(beats);
  state.accents = resizeAccents(state.accents, state.beats);
  updateDisplay();
}

function togglePlayback(): void {
  if (!playback) return;
  if (running) {
    playback.stop();
    running = false;
  } else {
    running = true;
    void playback.start();
  }
  updateDisplay();
}

/** Commit whatever is typed in the BPM field, falling back to the current tempo. */
function commitBpmField(field: HTMLInputElement): void {
  const typed = Number.parseInt(field.value, 10);
  if (Number.isNaN(typed)) {
    field.value = String(state.bpm);
    return;
  }
  setBpm(typed);
  field.value = String(state.bpm);
}

function setupBpmField(): void {
  const field = getInput("metronomeBpmValue");
  if (!field) return;

  // Tapping the number selects it, so the numeric keypad overwrites cleanly.
  field.addEventListener("focus", () => field.select());
  field.addEventListener("blur", () => commitBpmField(field));
  field.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") field.blur();
  });
}

function setupStepButton(id: string, delta: number): void {
  document
    .getElementById(id)
    ?.addEventListener("click", () => setBpm(state.bpm + delta));
}

function setupTempoControls(): void {
  setupStepButton("metronomeBpmDownLarge", -LARGE_BPM_STEP);
  setupStepButton("metronomeBpmDown", -SMALL_BPM_STEP);
  setupStepButton("metronomeBpmUp", SMALL_BPM_STEP);
  setupStepButton("metronomeBpmUpLarge", LARGE_BPM_STEP);

  document
    .getElementById("metronomeBpmSlider")
    ?.addEventListener("input", (e) => {
      setBpm(Number((e.target as HTMLInputElement).value));
    });

  setupBpmField();
}

function setupMeterControls(): void {
  document
    .getElementById("metronomeBeatsDown")
    ?.addEventListener("click", () => setBeats(state.beats - 1));
  document
    .getElementById("metronomeBeatsUp")
    ?.addEventListener("click", () => setBeats(state.beats + 1));

  for (const { value } of SUBDIVISIONS) {
    document
      .getElementById(`metronomeSubdiv${value}Btn`)
      ?.addEventListener("click", () => {
        state.subdivisions = value;
        updateDisplay();
      });
  }

  // Beat dots are re-rendered on every update, so accents are handled by
  // delegation from their stable container.
  document.getElementById("metronomeBeats")?.addEventListener("click", (e) => {
    const dot = (e.target as HTMLElement).closest(".metronome-beat");
    const index = Number(dot?.getAttribute("data-beat"));
    if (!dot || Number.isNaN(index)) return;
    state.accents[index] = nextAccent(state.accents[index]);
    updateDisplay();
  });
}

function resetState(): void {
  if (running) togglePlayback();
  state = { ...DEFAULTS, accents: defaultAccents(DEFAULTS.beats) };
  updateDisplay();
}

/** Stop the clicks when the metronome page is navigated away from. */
function setupRouteStop(): void {
  window.addEventListener("hashchange", () => {
    if (running && window.location.hash.slice(1) !== "metronome") {
      togglePlayback();
    }
  });
}

export function initMetronomeFeature(): void {
  const container = document.getElementById("metronome-page");
  if (!container) return;

  const persisted = loadPersisted<MetronomeState>(STORAGE_KEY, DEFAULTS);
  state = {
    bpm: clampBpm(persisted.bpm),
    beats: clampBeats(persisted.beats),
    subdivisions: persisted.subdivisions,
    accents: resizeAccents(
      Array.isArray(persisted.accents) ? persisted.accents : [],
      clampBeats(persisted.beats),
    ),
  };

  container.innerHTML = metronomePanelHtml(getSummary());
  document
    .getElementById("metronome-controls")
    ?.appendChild(createResetLink(resetState));

  const beatsEl = document.getElementById("metronomeBeats");
  const arm = document.getElementById("metronomePendulumArm");
  playback = createPlayback(() => state, {
    onBeat: (beat) => {
      if (beatsEl) highlightBeat(beatsEl, beat);
    },
    onAngle: (angle) => {
      if (arm) setPendulumAngle(arm, angle);
    },
  });

  setupTempoControls();
  setupMeterControls();
  setupRouteStop();
  document.getElementById("metronomeToggleBtn")?.addEventListener("click", () => {
    togglePlayback();
  });
  setupAccordionToggle("metronomeAccordionToggle");

  updateDisplay();
}
