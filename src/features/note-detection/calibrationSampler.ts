// Continuously sample pitch and report readings for calibration

import { detectPitch } from "./pitchDetector";
import {
  computeSpectralSignature,
  averageSignatures,
  type SpectralSignature,
} from "./spectralAnalysis";

const FREQUENCY_TOLERANCE = 0.3;
const CALIBRATION_FFT_SIZE = 4096;
const MAX_READINGS = 30;

/**
 * Normalize a detected frequency to the fundamental.
 * If the detector picked up a harmonic (2x or 3x the expected),
 * divide it down. Returns null if frequency doesn't match.
 */
function normalizeToFundamental(freq: number, expected: number): number | null {
  const low = expected * (1 - FREQUENCY_TOLERANCE);
  const high = expected * (1 + FREQUENCY_TOLERANCE);
  for (const divisor of [1, 2, 3]) {
    const fundamental = freq / divisor;
    if (fundamental >= low && fundamental <= high) {
      return fundamental;
    }
  }
  return null;
}

/**
 * Compute the median of a numeric array.
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export interface SamplingResult {
  medianFreq: number;
  spectralSignature: SpectralSignature | null;
}

/**
 * Continuously sample pitch and call onReading with the running median.
 * Also captures spectral signatures for timbre fingerprinting.
 * Temporarily increases FFT size for better low-frequency detection.
 * @returns A stop function that cleans up and restores the original FFT size.
 */
function pushCapped<T>(arr: T[], value: T, max: number): void {
  arr.push(value);
  if (arr.length > max) arr.shift();
}

interface SamplingState {
  readings: number[];
  spectralReadings: SpectralSignature[];
  analyser: AnalyserNode;
  sampleRate: number;
}

function processValidFrequency(
  freq: number,
  state: SamplingState,
  onReading: (result: SamplingResult) => void,
): void {
  pushCapped(state.readings, freq, MAX_READINGS);

  const sig = computeSpectralSignature(state.analyser, state.sampleRate, freq);
  if (sig) pushCapped(state.spectralReadings, sig, MAX_READINGS);

  onReading({
    medianFreq: median(state.readings),
    spectralSignature:
      state.spectralReadings.length > 0
        ? averageSignatures(state.spectralReadings)
        : null,
  });
}

export function startSampling(
  analyser: AnalyserNode,
  sampleRate: number,
  expectedFreq: number,
  onReading: (result: SamplingResult) => void,
): () => void {
  const originalFftSize = analyser.fftSize;
  analyser.fftSize = CALIBRATION_FFT_SIZE;
  const buffer = new Float32Array(CALIBRATION_FFT_SIZE);
  const state: SamplingState = {
    readings: [],
    spectralReadings: [],
    analyser,
    sampleRate,
  };
  let frameId = 0;

  function sample(): void {
    analyser.getFloatTimeDomainData(buffer);
    const rawFreq = detectPitch(buffer, sampleRate);
    if (rawFreq === null) {
      frameId = requestAnimationFrame(sample);
      return;
    }

    const freq = normalizeToFundamental(rawFreq, expectedFreq);
    if (freq !== null) {
      processValidFrequency(freq, state, onReading);
    }

    frameId = requestAnimationFrame(sample);
  }

  frameId = requestAnimationFrame(sample);

  return () => {
    cancelAnimationFrame(frameId);
    analyser.fftSize = originalFftSize;
  };
}
