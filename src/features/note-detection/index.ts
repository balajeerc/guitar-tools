// Note detection feature - listens to microphone and highlights detected notes

import { detectPitch } from "./pitchDetector";
import { frequencyToNote } from "./noteMapper";
import {
  highlightDetectedNote,
  clearHighlight,
  setCalibration,
  setCurrentSpectralSignature,
} from "./highlighter";
import { loadCalibration, saveCalibration, clearCalibration } from "./calibrationStorage";
import { startCalibrationWizard } from "./calibrationWizard";
import { computeSpectralSignature } from "./spectralAnalysis";
import { getCurrentRootIndex, getCurrentScale } from "../scales";
import { getScaleDegree } from "../../shared/musicTheory";

const BUFFER_SIZE = 2048;

/** RMS amplitude below this is treated as silence (avoids noisy detections on decay) */
const SILENCE_THRESHOLD = 0.01;

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStream: MediaStream | null = null;
let animationFrameId = 0;
let isListening = false;

function acquireMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

function setupAudio(stream: MediaStream): { ctx: AudioContext; node: AnalyserNode } {
  const ctx = new AudioContext();
  const node = ctx.createAnalyser();
  node.fftSize = BUFFER_SIZE;
  ctx.createMediaStreamSource(stream).connect(node);
  return { ctx, node };
}

function releaseMic(): void {
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop();
    mediaStream = null;
  }
  if (audioContext) {
    void audioContext.close();
    audioContext = null;
    analyser = null;
  }
}

/** Compute RMS amplitude of a buffer to gate out weak/decaying signals */
function computeRms(buffer: Float32Array): number {
  let sum = 0;
  for (const sample of buffer) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

function detectLoop(): void {
  if (!isListening || !analyser || !audioContext) return;

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);

  // Gate out weak signals to avoid noisy detections during note decay
  const rms = computeRms(buffer);
  if (rms < SILENCE_THRESHOLD) {
    setCurrentSpectralSignature(null);
    highlightDetectedNote(-1);
    updateDisplay(null, null, null, null);
    animationFrameId = requestAnimationFrame(detectLoop);
    return;
  }

  const frequency = detectPitch(buffer, audioContext.sampleRate);

  if (frequency !== null) {
    const sig = computeSpectralSignature(analyser, audioContext.sampleRate, frequency);
    setCurrentSpectralSignature(sig);

    const note = frequencyToNote(frequency);
    if (note) {
      highlightDetectedNote(note.midiNote, frequency);
      updateDisplay(note.name, frequency, note.centsOff, note.noteIndex);
    } else {
      highlightDetectedNote(-1);
      updateDisplay(null, null, null, null);
    }
  } else {
    setCurrentSpectralSignature(null);
    highlightDetectedNote(-1);
    updateDisplay(null, null, null, null);
  }

  animationFrameId = requestAnimationFrame(detectLoop);
}

/** Scale degree labels (1-indexed) */
const DEGREE_LABELS = ["1", "2", "3", "4", "5", "6", "7"];

function formatDegree(noteIndex: number | null): string {
  if (noteIndex === null) return "";
  const degree = getScaleDegree(noteIndex, getCurrentRootIndex(), getCurrentScale(), true);
  if (degree === -1) return "";
  return DEGREE_LABELS[degree];
}

function updateDisplay(name: string | null, freq: number | null, cents: number | null, noteIndex: number | null): void {
  const noteEl = document.getElementById("detectedNote");
  const freqEl = document.getElementById("detectedFrequency");
  const centsEl = document.getElementById("detectedCents");
  const degreeEl = document.getElementById("detectedDegree");

  if (noteEl) noteEl.textContent = name ?? "-";
  if (freqEl) freqEl.textContent = freq !== null ? `${Math.round(freq)} Hz` : "";
  if (degreeEl) degreeEl.textContent = formatDegree(noteIndex);
  if (centsEl) {
    if (cents !== null) {
      const sign = cents >= 0 ? "+" : "";
      centsEl.textContent = `${sign}${cents}¢`;
      centsEl.className = `detected-cents ${Math.abs(cents) <= 5 ? "in-tune" : "out-of-tune"}`;
    } else {
      centsEl.textContent = "";
      centsEl.className = "detected-cents";
    }
  }
}

function renderListeningUI(container: HTMLElement): void {
  container.innerHTML = `
    <button class="note-detection-btn active" id="noteDetectionBtn">⏹ Stop</button>
    <div class="detection-display" id="detectionDisplay">
      <span class="detected-note" id="detectedNote">-</span>
      <span class="detected-degree" id="detectedDegree"></span>
      <span class="detected-frequency" id="detectedFrequency"></span>
      <span class="detected-cents" id="detectedCents"></span>
    </div>
    <button class="calibration-btn recalibrate" id="recalibrateBtn">Recalibrate</button>
  `;
}

function renderIdleUI(container: HTMLElement): void {
  container.innerHTML = `
    <button class="note-detection-btn" id="noteDetectionBtn">🎤 Listen</button>
    <div class="detection-display" id="detectionDisplay">
      <span class="detected-note" id="detectedNote">-</span>
      <span class="detected-degree" id="detectedDegree"></span>
      <span class="detected-frequency" id="detectedFrequency"></span>
      <span class="detected-cents" id="detectedCents"></span>
    </div>
  `;
}

async function startListening(container: HTMLElement): Promise<void> {
  mediaStream = await acquireMic();
  const { ctx, node } = setupAudio(mediaStream);
  audioContext = ctx;
  analyser = node;

  const existing = loadCalibration();
  if (existing) {
    setCalibration(existing.frequencies, existing.spectralSignatures);
  } else {
    const result = await startCalibrationWizard(container, node, ctx.sampleRate);
    if (!result) {
      releaseMic();
      return;
    }
    saveCalibration(result);
    setCalibration(result.frequencies, result.spectralSignatures);
  }

  isListening = true;
  renderListeningUI(container);
  bindButtons(container);
  detectLoop();
}

function stopListening(container: HTMLElement): void {
  isListening = false;
  cancelAnimationFrame(animationFrameId);
  releaseMic();
  clearHighlight();
  renderIdleUI(container);
  bindButtons(container);
}

async function recalibrate(container: HTMLElement): Promise<void> {
  isListening = false;
  cancelAnimationFrame(animationFrameId);
  clearHighlight();
  clearCalibration();

  if (!analyser || !audioContext) return;
  const result = await startCalibrationWizard(container, analyser, audioContext.sampleRate);
  if (!result) {
    stopListening(container);
    return;
  }
  saveCalibration(result);
  setCalibration(result.frequencies, result.spectralSignatures);

  isListening = true;
  renderListeningUI(container);
  bindButtons(container);
  detectLoop();
}

function bindButtons(container: HTMLElement): void {
  const btn = document.getElementById("noteDetectionBtn");
  const recalBtn = document.getElementById("recalibrateBtn");

  btn?.addEventListener("click", () => {
    if (isListening) {
      stopListening(container);
    } else {
      void startListening(container);
    }
  });

  recalBtn?.addEventListener("click", () => void recalibrate(container));
}

export function initNoteDetection(): void {
  const container = document.getElementById("noteDetectionContainer");
  if (!container) return;
  renderIdleUI(container);
  bindButtons(container);
}
