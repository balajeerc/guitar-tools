// YIN pitch detection algorithm
// Reference: de Cheveigné, A., & Kawahara, H. (2002). YIN, a fundamental frequency estimator

const YIN_THRESHOLD = 0.15;

/**
 * Compute the difference function for the YIN algorithm.
 * For each lag τ, computes the sum of squared differences.
 */
function difference(buffer: Float32Array, halfLen: number, result: Float32Array): void {
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    result[tau] = sum;
  }
}

/**
 * Cumulative mean normalized difference function.
 * Normalizes the difference function to make threshold comparison meaningful.
 */
function cumulativeMeanNormalize(diff: Float32Array, halfLen: number): void {
  diff[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += diff[tau];
    diff[tau] *= tau / runningSum;
  }
}

/**
 * Find the first dip below the threshold in the CMNDF,
 * then pick the tau with the smallest value in that dip.
 */
function absoluteThreshold(diff: Float32Array, halfLen: number): number {
  for (let tau = 2; tau < halfLen; tau++) {
    if (diff[tau] < YIN_THRESHOLD) {
      // Find the local minimum of this dip
      let minTau = tau;
      for (let j = tau + 1; j < halfLen && diff[j] < diff[j - 1]; j++) {
        minTau = j;
      }
      return minTau;
    }
  }
  return -1; // No pitch detected
}

/**
 * Parabolic interpolation around the detected tau for sub-sample accuracy.
 */
function parabolicInterpolation(diff: Float32Array, tau: number, halfLen: number): number {
  if (tau <= 0 || tau >= halfLen - 1) return tau;

  const s0 = diff[tau - 1];
  const s1 = diff[tau];
  const s2 = diff[tau + 1];
  const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));

  return tau + adjustment;
}

/**
 * Detect the fundamental frequency from an audio buffer using the YIN algorithm.
 * @param buffer - Raw audio samples (Float32Array from AnalyserNode)
 * @param sampleRate - Audio sample rate in Hz
 * @returns Detected frequency in Hz, or null if no clear pitch
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const halfLen = Math.floor(buffer.length / 2);
  const diff = new Float32Array(halfLen);

  difference(buffer, halfLen, diff);
  cumulativeMeanNormalize(diff, halfLen);

  const tau = absoluteThreshold(diff, halfLen);
  if (tau === -1) return null;

  const refinedTau = parabolicInterpolation(diff, tau, halfLen);
  return sampleRate / refinedTau;
}
