// Spectral analysis for string disambiguation via timbre fingerprinting

/** Noise floor in dB — bins below this are ignored */
const NOISE_FLOOR_DB = -80;

/** Number of harmonics to analyze (2nd through 5th) */
const HARMONIC_COUNT = 4;

export interface SpectralSignature {
  /** Spectral centroid in Hz (measures brightness) */
  centroid: number;
  /** Energy ratios of harmonics 2-5 relative to the fundamental */
  harmonicRatios: [number, number, number, number];
}

/** Convert dB value to linear power, flooring at noise level */
function dbToLinear(db: number): number {
  if (db < NOISE_FLOOR_DB) return 0;
  return Math.pow(10, db / 10);
}

/**
 * Find the magnitude (in linear power) of the FFT bin closest to a target frequency.
 * Searches a small window around the target for the peak bin.
 */
function peakMagnitudeNear(
  fftData: Float32Array,
  targetFreq: number,
  binWidth: number,
): number {
  const centerBin = Math.round(targetFreq / binWidth);
  const searchRadius = 2;
  let maxPower = 0;

  for (
    let b = Math.max(0, centerBin - searchRadius);
    b <= Math.min(fftData.length - 1, centerBin + searchRadius);
    b++
  ) {
    const power = dbToLinear(fftData[b]);
    if (power > maxPower) maxPower = power;
  }

  return maxPower;
}

/**
 * Compute the spectral centroid from FFT magnitude data.
 * Centroid = weighted average of frequencies, weighted by power.
 */
function computeCentroid(fftData: Float32Array, binWidth: number): number {
  let weightedSum = 0;
  let totalPower = 0;

  for (const [b, dbValue] of fftData.entries()) {
    const power = dbToLinear(dbValue);
    const freq = b * binWidth;
    weightedSum += freq * power;
    totalPower += power;
  }

  return totalPower > 0 ? weightedSum / totalPower : 0;
}

/**
 * Compute harmonic energy ratios (harmonics 2-5 relative to fundamental).
 */
function computeHarmonicRatios(
  fftData: Float32Array,
  fundamentalFreq: number,
  binWidth: number,
): [number, number, number, number] {
  const fundamentalPower = peakMagnitudeNear(fftData, fundamentalFreq, binWidth);
  if (fundamentalPower === 0) return [0, 0, 0, 0];

  const ratios: [number, number, number, number] = [0, 0, 0, 0];
  for (let h = 0; h < HARMONIC_COUNT; h++) {
    const harmonicFreq = fundamentalFreq * (h + 2);
    const harmonicPower = peakMagnitudeNear(fftData, harmonicFreq, binWidth);
    ratios[h] = harmonicPower / fundamentalPower;
  }

  return ratios;
}

/**
 * Extract a spectral signature from the analyser's current FFT data.
 * Returns null if signal is below noise floor.
 */
export function computeSpectralSignature(
  analyser: AnalyserNode,
  sampleRate: number,
  fundamentalFreq: number,
): SpectralSignature | null {
  const fftData = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(fftData);

  const binWidth = sampleRate / analyser.fftSize;
  const fundamentalPower = peakMagnitudeNear(fftData, fundamentalFreq, binWidth);

  if (fundamentalPower === 0) return null;

  return {
    centroid: computeCentroid(fftData, binWidth),
    harmonicRatios: computeHarmonicRatios(fftData, fundamentalFreq, binWidth),
  };
}

/**
 * Compute distance between two spectral signatures.
 * Lower values indicate more similar timbre.
 */
export function spectralDistance(a: SpectralSignature, b: SpectralSignature): number {
  // Normalize centroid difference by a typical range (~500 Hz)
  const centroidDiff = (a.centroid - b.centroid) / 500;

  let harmonicDiffSq = 0;
  for (let i = 0; i < HARMONIC_COUNT; i++) {
    const diff = a.harmonicRatios[i] - b.harmonicRatios[i];
    harmonicDiffSq += diff * diff;
  }

  return Math.sqrt(centroidDiff * centroidDiff + harmonicDiffSq);
}

/**
 * Average multiple spectral signatures into a single representative one.
 * Used during calibration to collapse readings into one signature per string.
 */
export function averageSignatures(signatures: SpectralSignature[]): SpectralSignature {
  const count = signatures.length;
  let centroidSum = 0;
  const ratioSums: [number, number, number, number] = [0, 0, 0, 0];

  for (const sig of signatures) {
    centroidSum += sig.centroid;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
      ratioSums[i] += sig.harmonicRatios[i];
    }
  }

  return {
    centroid: centroidSum / count,
    harmonicRatios: [
      ratioSums[0] / count,
      ratioSums[1] / count,
      ratioSums[2] / count,
      ratioSums[3] / count,
    ],
  };
}
