// Listener feature — standalone audio note detection with scale degree display

import { detectPitch } from "../note-detection/pitchDetector";
import { frequencyToNote } from "../note-detection/noteMapper";
import { NOTES } from "../../shared/constants";
import { setupAccordionToggle } from "../../shared/accordion";
import {
  acquireMic,
  setupAudio,
  releaseMic,
  computeRms,
  SILENCE_THRESHOLD,
} from "../../shared/audioUtils";
import { renderScaleStrip, updateListenerDisplay } from "./renderer";
import type { ListenerScaleMode } from "./types";

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStream: MediaStream | null = null;
let animationFrameId = 0;
let isListening = false;

// Listener-local scale state
let currentRootIndex = 3; // C
let currentMode: ListenerScaleMode = "major";

function releaseAudio(): void {
  releaseMic(mediaStream, audioContext);
  mediaStream = null;
  audioContext = null;
  analyser = null;
}

function detectLoop(): void {
  if (!isListening || !analyser || !audioContext) return;

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);

  const rms = computeRms(buffer);
  if (rms < SILENCE_THRESHOLD) {
    updateListenerDisplay(null, null, null, currentRootIndex, currentMode);
    animationFrameId = requestAnimationFrame(detectLoop);
    return;
  }

  const frequency = detectPitch(buffer, audioContext.sampleRate);

  if (frequency !== null) {
    const note = frequencyToNote(frequency);
    if (note) {
      updateListenerDisplay(
        note.noteIndex,
        note.name,
        note.centsOff,
        currentRootIndex,
        currentMode,
      );
    } else {
      updateListenerDisplay(null, null, null, currentRootIndex, currentMode);
    }
  } else {
    updateListenerDisplay(null, null, null, currentRootIndex, currentMode);
  }

  animationFrameId = requestAnimationFrame(detectLoop);
}

function renderListeningUI(): void {
  const btn = document.getElementById("listenerToggleBtn");
  if (btn) {
    btn.textContent = "Stop";
    btn.classList.add("active");
  }
}

function renderIdleUI(): void {
  const btn = document.getElementById("listenerToggleBtn");
  if (btn) {
    btn.textContent = "Listen";
    btn.classList.remove("active");
  }
  updateListenerDisplay(null, null, null, currentRootIndex, currentMode);
}

async function startListening(): Promise<void> {
  mediaStream = await acquireMic();
  const { ctx, node } = setupAudio(mediaStream);
  audioContext = ctx;
  analyser = node;

  isListening = true;
  renderListeningUI();
  detectLoop();
}

function stopListening(): void {
  isListening = false;
  cancelAnimationFrame(animationFrameId);
  releaseAudio();
  renderIdleUI();
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
    if (isListening) {
      stopListening();
    } else {
      void startListening();
    }
  });
}

export function initListenerFeature(): void {
  const page = document.getElementById("listener-page");
  if (!page) return;

  setupControls();
  setupToggle();
  setupAccordionToggle("listenerControlsAccordionToggle");
  reRenderStrip();
  renderIdleUI();
}
