// Circle of Fifths feature: pick a major or relative-minor key on the wheel,
// then toggle scale degrees to build a chord progression in that key.

import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { CIRCLE_KEYS } from "./constants";
import { renderPanel } from "./panel";
import { renderWheel } from "./renderer";
import { DEGREE_COUNT, type KeyMode } from "./theory";

interface CircleOfFifthsState {
  index: number;
  mode: KeyMode;
  degrees: number[];
}

const STORAGE_KEY = "circle-of-fifths-state";
const DEFAULTS: CircleOfFifthsState = {
  index: 0,
  mode: "major",
  degrees: [0, 3, 4], // I - IV - V
};

let state: CircleOfFifthsState = defaultState();

let wheelEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;

function defaultState(): CircleOfFifthsState {
  return { ...DEFAULTS, degrees: [...DEFAULTS.degrees] };
}

/** Tonic of the currently selected key, spelled as the wheel spells it. */
function tonic(): string {
  const key = CIRCLE_KEYS[state.index];
  return state.mode === "major" ? key.major : key.minor;
}

function resetState(): void {
  state = defaultState();
  update();
}

function update(): void {
  if (!wheelEl || !panelEl) return;

  wheelEl.innerHTML = renderWheel(state);
  panelEl.innerHTML = renderPanel(tonic(), state.mode, state.degrees);
  panelEl
    .querySelector(".cof-reset-row")
    ?.appendChild(createResetLink(resetState));

  savePersisted(STORAGE_KEY, state);
}

function handleWheelClick(event: MouseEvent): void {
  const sector = (event.target as Element).closest(".cof-sector");
  if (!sector) return;

  const index = Number(sector.getAttribute("data-index"));
  const mode = sector.getAttribute("data-mode") === "minor" ? "minor" : "major";
  if (state.index === index && state.mode === mode) return;

  state = { ...state, index, mode };
  update();
}

function handleDegreeClick(event: MouseEvent): void {
  const button = (event.target as Element).closest(".cof-degree-btn");
  if (!button) return;

  const degree = Number(button.getAttribute("data-degree"));
  const degrees = state.degrees.includes(degree)
    ? state.degrees.filter((d) => d !== degree)
    : [...state.degrees, degree];

  state = { ...state, degrees };
  update();
}

function inRange(value: number, limit: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < limit;
}

/** Read persisted state, discarding anything that no longer makes sense. */
function loadState(): CircleOfFifthsState {
  const saved = loadPersisted<CircleOfFifthsState>(STORAGE_KEY, DEFAULTS);

  return {
    index: inRange(saved.index, CIRCLE_KEYS.length) ? saved.index : DEFAULTS.index,
    mode: saved.mode === "minor" ? "minor" : "major",
    degrees: Array.isArray(saved.degrees)
      ? saved.degrees.filter((degree) => inRange(degree, DEGREE_COUNT))
      : [...DEFAULTS.degrees],
  };
}

export function initCircleOfFifthsFeature(): void {
  const container = document.getElementById("circle-of-fifths-page");
  if (!container) return;

  state = loadState();

  container.innerHTML = `
    <div class="cof-wheel-wrapper" id="cofWheel"></div>
    <div class="cof-panel" id="cofPanel"></div>
  `;

  wheelEl = document.getElementById("cofWheel");
  panelEl = document.getElementById("cofPanel");

  wheelEl?.addEventListener("click", handleWheelClick);
  panelEl?.addEventListener("click", handleDegreeClick);

  update();
}
