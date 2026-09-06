// Tuner feature — Fender-style guitar tuner with per-string selection

import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";
import { createAudioInputPanel } from "../../shared/audioInput";
import { STANDARD_TUNING } from "./constants";
import {
  renderMeterSegments,
  updateNeedle,
  updateTunerNoteDisplay,
  updateStringHighlight,
  updateMeterGlow,
} from "./renderer";

const STORAGE_KEY = "tuner-state";
const DEFAULT_SELECTED_STRING: number | null = null;

/** Currently selected string index (null = auto-detect any note) */
let selectedString: number | null = DEFAULT_SELECTED_STRING;

// DOM element references (cached on init)
let needleEl: SVGLineElement | null = null;
let segmentsEl: SVGGElement | null = null;
let noteNameEl: HTMLElement | null = null;
let centsEl: HTMLElement | null = null;
let stringsContainer: HTMLElement | null = null;

let listener: AudioListenerHandle;

function updateDisplay(
  noteName: string | null,
  centsOff: number | null,
  matchedString: number | null,
): void {
  if (needleEl) updateNeedle(needleEl, centsOff);
  if (noteNameEl && centsEl)
    updateTunerNoteDisplay(noteNameEl, centsEl, noteName, centsOff);
  if (segmentsEl) updateMeterGlow(segmentsEl, centsOff);
  if (stringsContainer) updateStringHighlight(stringsContainer, matchedString);
}

/** Find which standard-tuning string (if any) matches the detected note */
function matchString(
  midiNote: number,
  noteIndex: number,
): number | null {
  // If a specific string is selected, only match that one
  if (selectedString !== null) {
    const target = STANDARD_TUNING[selectedString];
    if (target.midi === midiNote) return selectedString;
    return null;
  }

  // Auto-detect: find the string whose MIDI note matches
  for (const [i, str] of STANDARD_TUNING.entries()) {
    if (str.midi === midiNote) return i;
  }

  // Fallback: match by note name (any octave) for visual feedback
  for (const [i, str] of STANDARD_TUNING.entries()) {
    if (str.noteIndex === noteIndex) return i;
  }

  return null;
}

function renderButtonState(listening: boolean): void {
  const btn = document.getElementById("tunerToggleBtn");
  if (!btn) return;
  btn.textContent = listening ? "Stop listening" : "Start listening";
  btn.classList.toggle("active", listening);
}

function setupToggle(): void {
  const btn = document.getElementById("tunerToggleBtn");
  btn?.addEventListener("click", () => {
    if (listener.isListening()) {
      listener.stop();
    } else {
      void listener.start();
    }
  });
}

function setupStringButtons(): void {
  if (!stringsContainer) return;

  const container = stringsContainer;
  container.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(".tuner-string-btn");
    if (!btn) return;

    const idx = Number((btn as HTMLElement).dataset.string);

    // Toggle: clicking the same string deselects it (auto mode)
    selectedString = selectedString === idx ? null : idx;

    savePersisted(STORAGE_KEY, selectedString);
    updateStringHighlight(container, selectedString);
  });
}

function resetState(): void {
  selectedString = DEFAULT_SELECTED_STRING;
  savePersisted(STORAGE_KEY, selectedString);
  if (stringsContainer) updateStringHighlight(stringsContainer, selectedString);
}

export function initTunerFeature(): void {
  const page = document.getElementById("tuner-page");
  if (!page) return;

  // Cache DOM references
  needleEl = document.getElementById("tunerNeedle") as SVGLineElement | null;
  segmentsEl = document.getElementById(
    "tunerMeterSegments",
  ) as SVGGElement | null;
  noteNameEl = document.getElementById("tunerNoteName");
  centsEl = document.getElementById("tunerCents");
  stringsContainer = document.getElementById("tunerStrings");

  selectedString = loadPersisted<number | null>(
    STORAGE_KEY,
    DEFAULT_SELECTED_STRING,
  );

  // Render the static meter segments
  if (segmentsEl) renderMeterSegments(segmentsEl);

  listener = createAudioListener({
    onNote(note) {
      if (note) {
        const matched = matchString(note.midiNote, note.noteIndex);
        updateDisplay(note.name, note.centsOff, matched ?? selectedString);
      } else {
        updateDisplay(null, null, selectedString);
      }
    },
    onStart() {
      renderButtonState(true);
    },
    onStop() {
      renderButtonState(false);
      updateDisplay(null, null, selectedString);
    },
  });

  setupToggle();
  setupStringButtons();

  page.appendChild(createAudioInputPanel("tuner"));

  if (stringsContainer) {
    const resetRow = document.createElement("div");
    resetRow.className = "tuner-reset-row";
    resetRow.appendChild(createResetLink(resetState));
    stringsContainer.insertAdjacentElement("afterend", resetRow);
  }

  renderButtonState(false);
  updateDisplay(null, null, selectedString);
}
