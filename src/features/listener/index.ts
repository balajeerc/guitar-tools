// Listener feature — standalone audio note detection with scale degree display

import { getNoteName, type AccidentalStyle } from "../../shared/constants";
import { setupAccordionToggle } from "../../shared/accordion";
import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { setButtonActive } from "../../shared/dom";
import { renderScaleStrip, updateListenerDisplay } from "./renderer";
import type { ListenerScaleMode } from "./types";

interface ListenerState {
  rootIndex: number;
  mode: ListenerScaleMode;
  accidental: AccidentalStyle;
}

const STORAGE_KEY = "listener-state";
const DEFAULTS: ListenerState = {
  rootIndex: 3, // C
  mode: "major",
  accidental: "sharp",
};

// Listener-local scale state
let currentRootIndex = DEFAULTS.rootIndex;
let currentMode: ListenerScaleMode = DEFAULTS.mode;
let currentAccidental: AccidentalStyle = DEFAULTS.accidental;

function saveState(): void {
  savePersisted(STORAGE_KEY, {
    rootIndex: currentRootIndex,
    mode: currentMode,
    accidental: currentAccidental,
  } satisfies ListenerState);
}

function applyState(s: ListenerState): void {
  currentRootIndex = s.rootIndex;
  currentMode = s.mode;
  currentAccidental = s.accidental;
}

let listener: AudioListenerHandle;

function renderIdleDisplay(): void {
  updateListenerDisplay(null, null, null, currentRootIndex, currentMode);
}

function renderButtonState(listening: boolean): void {
  const btn = document.getElementById("listenerToggleBtn");
  if (!btn) return;
  btn.textContent = listening ? "Stop" : "Listen";
  btn.classList.toggle("active", listening);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function updateControlsSummary(): void {
  const summary = document.getElementById("listenerControlsSummary");
  if (!summary) return;
  summary.textContent = `${getNoteName(currentRootIndex, currentAccidental)} ${capitalize(currentMode)}`;
}

function reRenderStrip(): void {
  const page = document.getElementById("listener-page");
  if (!page) return;
  renderScaleStrip(page, currentRootIndex, currentMode, currentAccidental);
  updateControlsSummary();
  saveState();
}

function updateNoteLabel(): void {
  const el = document.getElementById("listenerCurrentNote");
  if (el) el.textContent = getNoteName(currentRootIndex, currentAccidental);
}

function setActiveScaleBtn(activeBtn: HTMLElement, allBtns: HTMLElement[]): void {
  for (const btn of allBtns) btn.classList.remove("active");
  activeBtn.classList.add("active");
}

/** Sync control buttons to match current state */
function syncControls(): void {
  updateNoteLabel();
  setButtonActive("listenerMajorBtn", currentMode === "major");
  setButtonActive("listenerMinorBtn", currentMode === "minor");
  setButtonActive("listenerFullBtn", currentMode === "full");
  setButtonActive("listenerSharpBtn", currentAccidental === "sharp");
  setButtonActive("listenerFlatBtn", currentAccidental === "flat");
}

function resetState(): void {
  applyState(DEFAULTS);
  syncControls();
  reRenderStrip();
}

function setupControls(): void {
  const prevBtn = document.getElementById("listenerPrevNote");
  const nextBtn = document.getElementById("listenerNextNote");
  const majorBtn = document.getElementById("listenerMajorBtn");
  const minorBtn = document.getElementById("listenerMinorBtn");
  const fullBtn = document.getElementById("listenerFullBtn");
  const sharpBtn = document.getElementById("listenerSharpBtn");
  const flatBtn = document.getElementById("listenerFlatBtn");

  const scaleBtns = [majorBtn, minorBtn, fullBtn].filter(
    (b): b is HTMLElement => b !== null,
  );
  const accidentalBtns = [sharpBtn, flatBtn].filter(
    (b): b is HTMLElement => b !== null,
  );

  prevBtn?.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex - 1 + 12) % 12;
    updateNoteLabel();
    reRenderStrip();
  });

  nextBtn?.addEventListener("click", () => {
    currentRootIndex = (currentRootIndex + 1) % 12;
    updateNoteLabel();
    reRenderStrip();
  });

  majorBtn?.addEventListener("click", () => {
    currentMode = "major";
    setActiveScaleBtn(majorBtn, scaleBtns);
    reRenderStrip();
  });

  minorBtn?.addEventListener("click", () => {
    currentMode = "minor";
    setActiveScaleBtn(minorBtn, scaleBtns);
    reRenderStrip();
  });

  fullBtn?.addEventListener("click", () => {
    currentMode = "full";
    setActiveScaleBtn(fullBtn, scaleBtns);
    reRenderStrip();
  });

  sharpBtn?.addEventListener("click", () => {
    currentAccidental = "sharp";
    setActiveScaleBtn(sharpBtn, accidentalBtns);
    updateNoteLabel();
    reRenderStrip();
  });

  flatBtn?.addEventListener("click", () => {
    currentAccidental = "flat";
    setActiveScaleBtn(flatBtn, accidentalBtns);
    updateNoteLabel();
    reRenderStrip();
  });
}

function setupToggle(): void {
  const btn = document.getElementById("listenerToggleBtn");
  btn?.addEventListener("click", () => {
    if (listener.isListening()) {
      listener.stop();
    } else {
      void listener.start();
    }
  });
}

export function initListenerFeature(): void {
  const page = document.getElementById("listener-page");
  if (!page) return;

  applyState(loadPersisted(STORAGE_KEY, DEFAULTS));

  listener = createAudioListener({
    onNote(note) {
      if (note) {
        updateListenerDisplay(
          note.noteIndex,
          getNoteName(note.noteIndex, currentAccidental),
          note.centsOff,
          currentRootIndex,
          currentMode,
        );
      } else {
        renderIdleDisplay();
      }
    },
    onStart() {
      renderButtonState(true);
    },
    onStop() {
      renderButtonState(false);
      renderIdleDisplay();
    },
  });

  setupControls();
  setupToggle();
  setupAccordionToggle("listenerControlsAccordionToggle");

  document
    .getElementById("listenerControlsPanel")
    ?.appendChild(createResetLink(resetState));

  syncControls();
  reRenderStrip();
  renderIdleDisplay();
}
