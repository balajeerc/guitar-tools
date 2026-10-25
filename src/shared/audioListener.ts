// Shared audio listener — manages mic acquisition, pitch detection loop,
// and start/stop lifecycle for features that listen to the microphone.
// Applies exponential moving average smoothing on detected frequency
// to reduce flickering from natural pitch wobble.

import { detectPitch } from "../features/note-detection/pitchDetector";
import { frequencyToNote, type DetectedNote } from "../features/note-detection/noteMapper";
import {
  acquireMic,
  setupAudio,
  releaseMic,
  computeRms,
  SILENCE_THRESHOLD,
} from "./audioUtils";
import { AUDIO_INPUT_CHANGED_EVENT } from "./audioInput";
import { createScreenWakeLock } from "./screenWakeLock";

/** EMA smoothing factor: 0 = no smoothing, 1 = no memory. Lower = smoother. */
const SMOOTHING_ALPHA = 0.15;

/** How long to ignore pitch after a new attack (ms). Skips the noisy transient. */
const ATTACK_BLANKING_MS = 80;

/** Round frequency to nearest semitone number for change detection */
function freqToSemitone(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440));
}

export interface AudioListenerCallbacks {
  /** Called each frame with a detected note, or null if silent / no pitch */
  onNote: (note: DetectedNote | null) => void;
  /** Called when listening starts */
  onStart?: () => void;
  /** Called when listening stops */
  onStop?: () => void;
  /** Called when an active input cannot be opened */
  onError?: () => void;
}

export interface AudioListenerHandle {
  start: () => Promise<void>;
  stop: () => void;
  isListening: () => boolean;
}

/**
 * Create an audio listener that manages mic → pitch detection → callback.
 * Each feature gets its own independent handle with start/stop.
 */
export function createAudioListener(
  callbacks: AudioListenerCallbacks,
): AudioListenerHandle {
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let mediaStream: MediaStream | null = null;
  let animationFrameId = 0;
  let listening = false;
  const wakeLock = createScreenWakeLock();

  // Smoothing state
  let smoothedFreq: number | null = null;
  let lastSemitone: number | null = null;

  // Attack blanking state: ignore noisy transient right after a pluck
  let wasSilent = true;
  let attackTime = 0;

  function releaseAudio(): void {
    releaseMic(mediaStream, audioContext);
    mediaStream = null;
    audioContext = null;
    analyser = null;
  }

  function resetSmoothing(): void {
    smoothedFreq = null;
    lastSemitone = null;
    wasSilent = true;
  }

  function smoothFrequency(rawFreq: number): number {
    const semitone = freqToSemitone(rawFreq);

    // If the detected semitone changed, reset the EMA so we snap quickly
    if (lastSemitone !== null && semitone !== lastSemitone) {
      smoothedFreq = rawFreq;
    } else if (smoothedFreq !== null) {
      smoothedFreq = SMOOTHING_ALPHA * rawFreq + (1 - SMOOTHING_ALPHA) * smoothedFreq;
    } else {
      smoothedFreq = rawFreq;
    }

    lastSemitone = semitone;
    return smoothedFreq;
  }

  function detectLoop(): void {
    if (!listening || !analyser || !audioContext) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const rms = computeRms(buffer);
    if (rms < SILENCE_THRESHOLD) {
      resetSmoothing();
      callbacks.onNote(null);
      animationFrameId = requestAnimationFrame(detectLoop);
      return;
    }

    // Detect new attack: signal just emerged from silence
    const now = performance.now();
    if (wasSilent) {
      attackTime = now;
      wasSilent = false;
    }

    // Skip the noisy transient right after the pluck
    if (now - attackTime < ATTACK_BLANKING_MS) {
      animationFrameId = requestAnimationFrame(detectLoop);
      return;
    }

    const frequency = detectPitch(buffer, audioContext.sampleRate);

    if (frequency !== null) {
      const smoothed = smoothFrequency(frequency);
      const note = frequencyToNote(smoothed);
      callbacks.onNote(note);
    } else {
      resetSmoothing();
      callbacks.onNote(null);
    }

    animationFrameId = requestAnimationFrame(detectLoop);
  }

  async function start(): Promise<void> {
    resetSmoothing();
    mediaStream = await acquireMic();
    const { ctx, node } = setupAudio(mediaStream);
    audioContext = ctx;
    analyser = node;

    listening = true;
    wakeLock.start();
    callbacks.onStart?.();
    detectLoop();
  }

  function stop(): void {
    listening = false;
    wakeLock.stop();
    cancelAnimationFrame(animationFrameId);
    releaseAudio();
    resetSmoothing();
    callbacks.onStop?.();
  }

  async function restartForInputChange(): Promise<void> {
    if (!listening) return;
    stop();
    try {
      await start();
    } catch {
      callbacks.onError?.();
    }
  }

  window.addEventListener(AUDIO_INPUT_CHANGED_EVENT, () => void restartForInputChange());

  return {
    start,
    stop,
    isListening: () => listening,
  };
}
