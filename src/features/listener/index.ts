// Listener feature — standalone audio note detection with scale degree display

import { NOTES } from "../../shared/constants";
import { setupAccordionToggle } from "../../shared/accordion";
import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { renderScaleStrip, updateListenerDisplay } from "./renderer";
import type { ListenerScaleMode } from "./types";

// Listener-local scale state
let currentRootIndex = 3; // C
let currentMode: ListenerScaleMode = "major";

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
  summary.textContent = `${NOTES[currentRootIndex]} ${capitalize(currentMode)}`;
}

function reRenderStrip(): void {
  const page = document.getElementById("listener-page");
  if (!page) return;
  renderScaleStrip(page, currentRootIndex, currentMode);
  updateControlsSummary();
}

function updateNoteLabel(): void {
  const el = document.getElementById("listenerCurrentNote");
  if (el) el.textContent = NOTES[currentRootIndex];
}

function setActiveScaleBtn(activeBtn: HTMLElement, allBtns: HTMLElement[]): void {
  for (const btn of allBtns) btn.classList.remove("active");
  activeBtn.classList.add("active");
}

function setupControls(): void {
  const prevBtn = document.getElementById("listenerPrevNote");
  const nextBtn = document.getElementById("listenerNextNote");
  const majorBtn = document.getElementById("listenerMajorBtn");
  const minorBtn = document.getElementById("listenerMinorBtn");
  const fullBtn = document.getElementById("listenerFullBtn");

  const scaleBtns = [majorBtn, minorBtn, fullBtn].filter(
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

  listener = createAudioListener({
    onNote(note) {
      if (note) {
        updateListenerDisplay(
          note.noteIndex,
          note.name,
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
  reRenderStrip();
  renderIdleDisplay();
}
