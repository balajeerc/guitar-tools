// Persist calibration data to localStorage

import type { SpectralSignature } from "./spectralAnalysis";

const STORAGE_KEY = "note-detection-calibration";

type SixTuple<T> = [T, T, T, T, T, T];

export interface CalibrationData {
  /** Measured open string frequencies [lowE, A, D, G, B, highE] */
  frequencies: SixTuple<number>;
  /** Spectral signatures per open string (absent in legacy data) */
  spectralSignatures?: SixTuple<SpectralSignature>;
  /** Timestamp when calibration was performed */
  timestamp: number;
}

function isValidSignature(sig: unknown): sig is SpectralSignature {
  if (typeof sig !== "object" || sig === null) return false;
  const s = sig as SpectralSignature;
  return (
    typeof s.centroid === "number" &&
    Array.isArray(s.harmonicRatios) &&
    s.harmonicRatios.length === 4 &&
    s.harmonicRatios.every((r) => typeof r === "number")
  );
}

function isValidSignatures(sigs: unknown): sigs is SixTuple<SpectralSignature> {
  return Array.isArray(sigs) && sigs.length === 6 && sigs.every(isValidSignature);
}

/**
 * Load saved calibration data from localStorage.
 * Returns null if no valid data exists.
 */
export function loadCalibration(): CalibrationData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CalibrationData;
    if (
      Array.isArray(data.frequencies) &&
      data.frequencies.length === 6 &&
      data.frequencies.every((f) => typeof f === "number" && f > 0)
    ) {
      // Strip malformed spectral data but keep frequency calibration
      if (data.spectralSignatures && !isValidSignatures(data.spectralSignatures)) {
        delete data.spectralSignatures;
      }
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save calibration data to localStorage.
 */
export function saveCalibration(data: CalibrationData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/**
 * Remove stored calibration data.
 */
export function clearCalibration(): void {
  localStorage.removeItem(STORAGE_KEY);
}
