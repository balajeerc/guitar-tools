// Step-by-step calibration wizard UI

import { startSampling, type SamplingResult } from "./calibrationSampler";
import type { CalibrationData } from "./calibrationStorage";
import type { SpectralSignature } from "./spectralAnalysis";

const STRING_LABELS = [
  "Low E (6th)",
  "A (5th)",
  "D (4th)",
  "G (3rd)",
  "B (2nd)",
  "High E (1st)",
];

/** Approximate open string frequencies for filtering out wrong strings */
const EXPECTED_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

interface WizardButtons {
  nextBtn: HTMLButtonElement;
  skipBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
}

function renderWizardStep(container: HTMLElement, step: number): WizardButtons {
  container.innerHTML = `
    <div class="calibration-wizard">
      <div class="calibration-progress">
        ${STRING_LABELS.map((_, i) => {
          let cls = "calibration-dot";
          if (i < step) cls += " done";
          else if (i === step) cls += " active";
          return `<div class="${cls}"></div>`;
        }).join("")}
      </div>
      <div class="calibration-step-text">
        Step ${step + 1}/6: Play the <strong>${STRING_LABELS[step]}</strong> string open
      </div>
      <div class="calibration-status" id="calibrationStatus">Listening...</div>
      <div class="calibration-actions">
        <button class="calibration-btn next" id="calibrationNext" disabled>Next</button>
        <button class="calibration-btn skip" id="calibrationSkip">Skip</button>
        <button class="calibration-btn cancel" id="calibrationCancel">Cancel</button>
      </div>
    </div>
  `;

  return {
    nextBtn: document.getElementById("calibrationNext") as HTMLButtonElement,
    skipBtn: document.getElementById("calibrationSkip") as HTMLButtonElement,
    cancelBtn: document.getElementById("calibrationCancel") as HTMLButtonElement,
  };
}

/**
 * Run the calibration wizard, collecting open string frequencies.
 * Each step continuously samples pitch, then waits for the user to click Next.
 * @returns Calibration data, or null if the user cancelled
 */
export async function startCalibrationWizard(
  container: HTMLElement,
  analyser: AnalyserNode,
  sampleRate: number,
): Promise<CalibrationData | null> {
  const frequencies: number[] = [];
  const signatures: (SpectralSignature | null)[] = [];
  let cancelled = false;

  for (let step = 0; step < 6; step++) {
    if (cancelled) return null;

    const { nextBtn, skipBtn, cancelBtn } = renderWizardStep(container, step);
    const statusEl = document.getElementById("calibrationStatus");
    let latestResult: SamplingResult | null = null;

    // Start continuous sampling — updates display but doesn't auto-advance
    const stopSampling = startSampling(
      analyser,
      sampleRate,
      EXPECTED_FREQUENCIES[step],
      (result) => {
        latestResult = result;
        if (statusEl) statusEl.textContent = `Detected: ${Math.round(result.medianFreq)} Hz`;
        nextBtn.disabled = false;
      },
    );

    // Wait for user to click Next, Skip, or Cancel
    const stepResult = await new Promise<SamplingResult | "skip" | null>((resolve) => {
      nextBtn.addEventListener("click", () => resolve(latestResult));
      skipBtn.addEventListener("click", () => resolve("skip"));
      cancelBtn.addEventListener("click", () => {
        cancelled = true;
        resolve(null);
      });
    });

    stopSampling();

    if (cancelled || stepResult === null) return null;

    if (stepResult === "skip") {
      frequencies.push(EXPECTED_FREQUENCIES[step]);
      signatures.push(null);
    } else {
      frequencies.push(stepResult.medianFreq);
      signatures.push(stepResult.spectralSignature);
    }
  }

  const allSignatures = signatures.every((s): s is SpectralSignature => s !== null);

  return {
    frequencies: frequencies as CalibrationData["frequencies"],
    spectralSignatures: allSignatures
      ? (signatures as CalibrationData["spectralSignatures"])
      : undefined,
    timestamp: Date.now(),
  };
}
