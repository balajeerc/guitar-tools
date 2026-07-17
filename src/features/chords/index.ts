import type { DisplayMode } from "../../shared/types";
import { NOTES } from "../../shared/constants";
import { renderChords } from "./renderer";
import { renderChordCagedHeader } from "./cagedHeader";
import { CHORD_TYPES, getChordType } from "./chordTypes";
import { MOBILE_BREAKPOINT } from "../../shared/layout";
import { setupAccordionToggle } from "../../shared/accordion";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";

interface ChordsState {
  rootIndex: number;
  chordTypeId: string;
  displayMode: DisplayMode;
}

const STORAGE_KEY = "chords-state";
const DEFAULTS: ChordsState = {
  rootIndex: 3, // C
  chordTypeId: "maj",
  displayMode: "notes",
};

// Application state
let currentRootIndex = DEFAULTS.rootIndex;
let currentChordTypeId = DEFAULTS.chordTypeId;
let displayMode: DisplayMode = DEFAULTS.displayMode;

// Sync callbacks registered by the toggle groups, run on every state change
const syncCallbacks: Array<() => void> = [];
let rootDisplayEl: HTMLElement | null = null;

function saveState(): void {
  savePersisted(STORAGE_KEY, {
    rootIndex: currentRootIndex,
    chordTypeId: currentChordTypeId,
    displayMode,
  } satisfies ChordsState);
}

function getControlsSummary(): string {
  const chord = getChordType(currentChordTypeId);
  const display = displayMode === "intervals" ? "Intervals" : "Notes";
  return `${NOTES[currentRootIndex]} ${chord.name} · ${display}`;
}

function updateControlsSummary(): void {
  const summary = document.getElementById("chordsControlsSummary");
  if (summary) summary.textContent = getControlsSummary();
}

/** Sync all controls (toggle active states + root display) to current state. */
function syncControls(): void {
  if (rootDisplayEl) rootDisplayEl.textContent = NOTES[currentRootIndex];
  for (const sync of syncCallbacks) sync();
}

function updateDisplay(): void {
  renderChords(currentRootIndex, currentChordTypeId, displayMode);
  renderChordCagedHeader(currentRootIndex, currentChordTypeId);
  syncControls();
  updateControlsSummary();
  saveState();
}

function resetState(): void {
  currentRootIndex = DEFAULTS.rootIndex;
  currentChordTypeId = DEFAULTS.chordTypeId;
  displayMode = DEFAULTS.displayMode;
  updateDisplay();
}

/**
 * Build a segmented single-select toggle group. Registers its own sync
 * callback so the active button always reflects the current state.
 */
function createToggleGroup<T>(
  options: ReadonlyArray<{ value: T; label: string }>,
  isActive: (value: T) => boolean,
  onSelect: (value: T) => void,
  extraClass = "",
): HTMLElement {
  const group = document.createElement("div");
  group.className = `toggle-group ${extraClass}`.trim();

  const buttons: Array<{ value: T; btn: HTMLButtonElement }> = [];
  for (const { value, label } of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-btn";
    btn.textContent = label;
    btn.addEventListener("click", () => onSelect(value));
    group.appendChild(btn);
    buttons.push({ value, btn });
  }

  syncCallbacks.push(() => {
    for (const { value, btn } of buttons) {
      btn.classList.toggle("active", isActive(value));
    }
  });

  return group;
}

/** Wrap a labelled control in the standard control-group layout. */
function controlGroup(labelText: string, control: HTMLElement): HTMLElement {
  const container = document.createElement("div");
  container.className = "control-group";

  const label = document.createElement("span");
  label.className = "control-label";
  label.textContent = labelText;

  container.appendChild(label);
  container.appendChild(control);
  return container;
}

function createRootControls(): HTMLElement {
  const selector = document.createElement("div");
  selector.className = "note-selector";

  const prev = document.createElement("button");
  prev.className = "note-btn";
  prev.innerHTML = "&#10094;";
  prev.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex - 1 + 12) % 12;
    updateDisplay();
  });

  rootDisplayEl = document.createElement("div");
  rootDisplayEl.className = "note-display";
  rootDisplayEl.textContent = NOTES[currentRootIndex];

  const next = document.createElement("button");
  next.className = "note-btn";
  next.innerHTML = "&#10095;";
  next.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex + 1) % 12;
    updateDisplay();
  });

  selector.append(prev, rootDisplayEl, next);
  return controlGroup("Root:", selector);
}

function createChordTypeControls(): HTMLElement {
  const options = CHORD_TYPES.map((chord) => ({
    value: chord.id,
    label: chord.label,
  }));
  const group = createToggleGroup(
    options,
    (id) => id === currentChordTypeId,
    (id) => {
      currentChordTypeId = id;
      updateDisplay();
    },
    "chord-type-toggle",
  );
  return controlGroup("Type:", group);
}

function createDisplayControls(): HTMLElement {
  const group = createToggleGroup<DisplayMode>(
    [
      { value: "notes", label: "Notes" },
      { value: "intervals", label: "Intervals" },
    ],
    (mode) => mode === displayMode,
    (mode) => {
      displayMode = mode;
      updateDisplay();
    },
  );
  return controlGroup("Display:", group);
}

/**
 * Initialize the Chords feature
 */
export function initChordsFeature(): void {
  const container = document.getElementById("chords-page");
  if (!container) return;

  const persisted = loadPersisted<ChordsState>(STORAGE_KEY, DEFAULTS);
  currentRootIndex = persisted.rootIndex;
  currentChordTypeId = persisted.chordTypeId;
  displayMode = persisted.displayMode;

  container.innerHTML = `
    <div class="controls-wrapper">
      <button class="controls-accordion-toggle" id="chordsAccordionToggle">
        <span class="controls-summary" id="chordsControlsSummary">${getControlsSummary()}</span>
        <span class="controls-accordion-arrow">&#9662;</span>
      </button>
      <div class="controls" id="chords-controls">
        <!-- Controls inserted here -->
      </div>
    </div>

    <div class="chord-info" id="chordInfo"></div>

    <div class="fretboard-section">
      <div class="caged-header" id="chordsCagedHeader">
        <!-- Dynamically populated -->
      </div>
      <div class="fretboard-container">
        <div class="fretboard" id="fretboard-chords">
          <!-- Dynamically populated -->
        </div>
        <div class="fret-numbers" id="fretNumbers-chords">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  const controls = document.getElementById("chords-controls");
  if (controls) {
    controls.appendChild(createRootControls());
    controls.appendChild(createChordTypeControls());
    controls.appendChild(createDisplayControls());
    controls.appendChild(createResetLink(resetState));
  }

  setupAccordionToggle("chordsAccordionToggle");

  // Re-render when crossing the mobile breakpoint
  window
    .matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    .addEventListener("change", () => updateDisplay());

  // Initial render
  updateDisplay();
}
