// Highlight the single most likely fretboard position for a detected pitch

import { TOTAL_FRETS } from "../../shared/constants";
import { spectralDistance, type SpectralSignature } from "./spectralAnalysis";

const DETECTED_CLASS = "note-detected";

/**
 * MIDI note numbers for each open string in standard tuning (fallback).
 * String 0 = low E (E2), String 5 = high E (E4).
 */
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

interface FretPosition {
  stringIdx: number;
  fret: number;
}

interface ScoredCandidate extends FretPosition {
  spectralDist: number;
}

/** Minimum consecutive frames a position must be detected before switching */
const CONFIRM_FRAMES = 3;
/** Minimum ms to hold a position before allowing clear/change */
const HOLD_TIME_MS = 180;

let activePosition: FretPosition | null = null;
let calibratedFrequencies: number[] | null = null;
let calibratedSignatures: SpectralSignature[] | null = null;
let currentSignature: SpectralSignature | null = null;

/** Tracks the pending position and how many consecutive frames it's been seen */
let pendingPosition: FretPosition | null = null;
let pendingFrames = 0;
/** Timestamp when the current active position was set */
let activeSetAt = 0;

/**
 * Set calibrated open string frequencies and optional spectral signatures.
 */
export function setCalibration(
  frequencies: number[],
  signatures?: SpectralSignature[],
): void {
  calibratedFrequencies = frequencies;
  calibratedSignatures = signatures ?? null;
}

/** Smoothing factor for exponential moving average of spectral signature (0-1) */
const SPECTRAL_SMOOTH = 0.3;

/** Blend two signatures using exponential moving average */
function smoothSignature(prev: SpectralSignature, next: SpectralSignature): SpectralSignature {
  const a = SPECTRAL_SMOOTH;
  const b = 1 - a;
  return {
    centroid: a * next.centroid + b * prev.centroid,
    harmonicRatios: [
      a * next.harmonicRatios[0] + b * prev.harmonicRatios[0],
      a * next.harmonicRatios[1] + b * prev.harmonicRatios[1],
      a * next.harmonicRatios[2] + b * prev.harmonicRatios[2],
      a * next.harmonicRatios[3] + b * prev.harmonicRatios[3],
    ],
  };
}

/**
 * Update the current live spectral signature for the detected note.
 * Applies exponential smoothing to reduce frame-to-frame noise.
 */
export function setCurrentSpectralSignature(sig: SpectralSignature | null): void {
  if (!sig) {
    currentSignature = null;
    return;
  }
  currentSignature = currentSignature ? smoothSignature(currentSignature, sig) : sig;
}

/** Score a candidate's spectral distance against the live signature */
function scoreCandidate(stringIdx: number): number {
  if (calibratedSignatures && currentSignature) {
    return spectralDistance(currentSignature, calibratedSignatures[stringIdx]);
  }
  return Infinity;
}

/** Pick the best candidate from a list using spectral or heuristic sorting */
function pickBestCandidate(candidates: ScoredCandidate[]): ScoredCandidate {
  const hasSpectral = candidates.some((c) => c.spectralDist !== Infinity);
  if (hasSpectral) {
    candidates.sort((a, b) => a.spectralDist - b.spectralDist);
  } else {
    candidates.sort((a, b) => a.fret - b.fret || b.stringIdx - a.stringIdx);
  }
  return candidates[0];
}

/**
 * Find best position using calibrated frequencies and spectral signatures.
 * When spectral data is available, uses timbre matching to disambiguate.
 * Falls back to lowest-fret/highest-string heuristic otherwise.
 */
function findCalibratedPosition(frequency: number): FretPosition | null {
  if (!calibratedFrequencies) return null;

  const candidates: ScoredCandidate[] = [];

  for (const [s, openFreq] of calibratedFrequencies.entries()) {
    const semitones = 12 * Math.log2(frequency / openFreq);
    const fret = Math.round(semitones);
    if (fret < 0 || fret > TOTAL_FRETS) continue;

    const centsError = Math.abs(semitones - fret) * 100;
    if (centsError < 50) {
      candidates.push({ stringIdx: s, fret, spectralDist: scoreCandidate(s) });
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  return pickBestCandidate(candidates);
}

/**
 * Find best position using hardcoded MIDI values (fallback).
 */
function findFallbackPosition(midiNote: number): FretPosition | null {
  for (let s = OPEN_STRING_MIDI.length - 1; s >= 0; s--) {
    const fret = midiNote - OPEN_STRING_MIDI[s];
    if (fret >= 0 && fret <= TOTAL_FRETS) {
      return { stringIdx: s, fret };
    }
  }
  return null;
}

function isSamePosition(a: FretPosition | null, b: FretPosition | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.stringIdx === b.stringIdx && a.fret === b.fret;
}

/** Apply highlight to a specific fretboard position */
function applyHighlight(pos: FretPosition): void {
  const fretboard = document.getElementById("fretboard");
  if (!fretboard) return;

  const el = fretboard.querySelector(
    `.note[data-string="${pos.stringIdx}"][data-fret="${pos.fret}"]`,
  );

  if (el) {
    clearHighlight();
    el.classList.add(DETECTED_CLASS);
    activePosition = pos;
    activeSetAt = performance.now();
  }
}

/**
 * Highlight the single best-match note element on the fretboard.
 * Uses frame-counting and hold time to prevent flickering.
 * @param midiNote - MIDI note number, or -1 to clear
 * @param frequency - Raw frequency in Hz (used with calibration)
 */
export function highlightDetectedNote(midiNote: number, frequency?: number): void {
  let newPos: FretPosition | null = null;
  if (midiNote !== -1) {
    newPos = (frequency !== undefined && calibratedFrequencies)
      ? findCalibratedPosition(frequency)
      : findFallbackPosition(midiNote);
  }

  // Same position as active — nothing to do
  if (isSamePosition(activePosition, newPos)) {
    pendingPosition = null;
    pendingFrames = 0;
    return;
  }

  // Respect hold time — don't change/clear too quickly
  const elapsed = performance.now() - activeSetAt;
  if (activePosition && elapsed < HOLD_TIME_MS) return;

  // Clearing (null) — allow immediately after hold time
  if (!newPos) {
    clearHighlight();
    pendingPosition = null;
    pendingFrames = 0;
    return;
  }

  // New position — require CONFIRM_FRAMES consecutive detections
  if (isSamePosition(pendingPosition, newPos)) {
    pendingFrames++;
  } else {
    pendingPosition = newPos;
    pendingFrames = 1;
  }

  if (pendingFrames >= CONFIRM_FRAMES) {
    applyHighlight(newPos);
    pendingPosition = null;
    pendingFrames = 0;
  }
}

/**
 * Remove all note-detected highlights from the fretboard.
 */
export function clearHighlight(): void {
  activePosition = null;
  pendingPosition = null;
  pendingFrames = 0;
  const highlighted = document.querySelectorAll(`.${DETECTED_CLASS}`);
  for (const el of highlighted) {
    el.classList.remove(DETECTED_CLASS);
  }
}
