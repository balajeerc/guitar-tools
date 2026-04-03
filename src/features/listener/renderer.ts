// Renderer for the Listener feature — linear scale display + detected note

import { NOTES, MAJOR_SCALE, MINOR_SCALE } from "../../shared/constants";
import { getScaleDegree } from "../../shared/musicTheory";
import type { ListenerScaleMode } from "./types";

/** Full-scale degree labels for major/minor (1-indexed display) */
const MAJOR_DEGREE_LABELS = ["1", "2", "3", "4", "5", "6", "7"];
const MINOR_DEGREE_LABELS = ["1", "2", "b3", "4", "5", "b6", "b7"];
const CHROMATIC_DEGREE_LABELS = [
  "1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7",
];

function getDegreeLabels(mode: ListenerScaleMode): string[] {
  if (mode === "full") return CHROMATIC_DEGREE_LABELS;
  return mode === "major" ? MAJOR_DEGREE_LABELS : MINOR_DEGREE_LABELS;
}

type ScaleMembership = "major-only" | "minor-only" | "both" | "neither";

interface ScaleNote {
  name: string;
  noteIndex: number;
  degree: string;
  membership: ScaleMembership;
}

const MAJOR_SET = new Set(MAJOR_SCALE);
const MINOR_SET = new Set(MINOR_SCALE);

function getScaleMembership(semitone: number): ScaleMembership {
  const inMajor = MAJOR_SET.has(semitone);
  const inMinor = MINOR_SET.has(semitone);
  if (inMajor && inMinor) return "both";
  if (inMajor) return "major-only";
  if (inMinor) return "minor-only";
  return "neither";
}

/** Build the list of notes for the selected mode */
function getScaleNotes(rootIndex: number, mode: ListenerScaleMode): ScaleNote[] {
  if (mode === "full") {
    return CHROMATIC_DEGREE_LABELS.map((degree, i) => {
      const noteIndex = (rootIndex + i) % 12;
      return { name: NOTES[noteIndex], noteIndex, degree, membership: getScaleMembership(i) };
    });
  }

  const intervals = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const degreeLabels = getDegreeLabels(mode);

  return intervals.map((interval, i) => {
    const noteIndex = (rootIndex + interval) % 12;
    return { name: NOTES[noteIndex], noteIndex, degree: degreeLabels[i], membership: getScaleMembership(interval) };
  });
}

/** Render the linear scale strip into the container */
export function renderScaleStrip(
  container: HTMLElement,
  rootIndex: number,
  mode: ListenerScaleMode,
): void {
  const scaleNotes = getScaleNotes(rootIndex, mode);
  const strip = container.querySelector(".scale-strip");
  if (!strip) return;

  strip.innerHTML = scaleNotes
    .map(
      (n) =>
        `<div class="scale-strip-note ${n.membership}" data-note-index="${n.noteIndex}">
          <span class="strip-note-name">${n.name}</span>
          <span class="strip-note-degree">${n.degree}</span>
        </div>`,
    )
    .join("");
}

const FADE_DURATION_MS = 300;

function updateCentsDisplay(centsEl: HTMLElement, centsOff: number | null): void {
  if (centsOff !== null) {
    const sign = centsOff >= 0 ? "+" : "";
    centsEl.textContent = `${sign}${centsOff}¢`;
    centsEl.className = `listener-cents ${Math.abs(centsOff) <= 5 ? "in-tune" : "out-of-tune"}`;
  } else {
    centsEl.textContent = "";
    centsEl.className = "listener-cents";
  }
}

function formatDegree(
  noteIndex: number,
  rootIndex: number,
  mode: ListenerScaleMode,
): { label: string; inScale: boolean } {
  if (mode === "full") {
    const relative = (noteIndex - rootIndex + 12) % 12;
    return { label: CHROMATIC_DEGREE_LABELS[relative], inScale: true };
  }

  const scaleType = mode;
  const degree = getScaleDegree(noteIndex, rootIndex, scaleType, true);
  if (degree !== -1) {
    return { label: getDegreeLabels(mode)[degree], inScale: true };
  }
  return { label: "?", inScale: false };
}

function updateDegreeDisplay(
  degreeEl: HTMLElement,
  noteIndex: number | null,
  rootIndex: number,
  mode: ListenerScaleMode,
): void {
  if (noteIndex === null) return;

  const { label, inScale } = formatDegree(noteIndex, rootIndex, mode);
  degreeEl.textContent = label;
  degreeEl.classList.toggle("out-of-scale", !inScale);
}

function updateStripHighlight(noteIndex: number | null): void {
  const stripNotes = document.querySelectorAll(
    ".scale-strip .scale-strip-note",
  );
  for (const el of stripNotes) {
    const idx = Number((el as HTMLElement).dataset.noteIndex);
    const isTarget = noteIndex !== null && idx === noteIndex;
    if (isTarget) {
      el.classList.add("active");
      el.classList.remove("fading");
    } else if (el.classList.contains("active")) {
      el.classList.remove("active");
      el.classList.add("fading");
      setTimeout(() => el.classList.remove("fading"), FADE_DURATION_MS);
    }
  }
}

let fadeTimer: ReturnType<typeof setTimeout> | null = null;

function setDisplayFading(isFading: boolean): void {
  const display = document.querySelector(".listener-display");
  if (!display) return;
  display.classList.toggle("fading", isFading);
}

/** Highlight the active note on the scale strip and update the big display */
export function updateListenerDisplay(
  noteIndex: number | null,
  noteName: string | null,
  centsOff: number | null,
  rootIndex: number,
  mode: ListenerScaleMode,
): void {
  const noteEl = document.getElementById("listenerNoteName");
  const centsEl = document.getElementById("listenerCents");
  const degreeEl = document.getElementById("listenerDegree");

  if (noteIndex !== null) {
    if (fadeTimer) {
      clearTimeout(fadeTimer);
      fadeTimer = null;
    }
    setDisplayFading(false);
    if (noteEl) noteEl.textContent = noteName ?? "-";
    if (centsEl) updateCentsDisplay(centsEl, centsOff);
    if (degreeEl) updateDegreeDisplay(degreeEl, noteIndex, rootIndex, mode);
  } else if (!fadeTimer) {
    setDisplayFading(true);
    fadeTimer = setTimeout(() => {
      if (noteEl) noteEl.textContent = "-";
      if (centsEl) {
        centsEl.textContent = "";
        centsEl.className = "listener-cents";
      }
      if (degreeEl) {
        degreeEl.textContent = "";
        degreeEl.classList.remove("out-of-scale");
      }
      fadeTimer = null;
    }, FADE_DURATION_MS);
  }

  updateStripHighlight(noteIndex);
}
