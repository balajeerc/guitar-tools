// Shared audio utilities for microphone acquisition and pitch detection

import {
  clearSelectedAudioInput,
  getSelectedAudioInputId,
  notifyAudioInputsAvailable,
} from "./audioInput";

const BUFFER_SIZE = 2048;

/** RMS amplitude below this is treated as silence */
export const SILENCE_THRESHOLD = 0.005;

function audioConstraints(deviceId: string | null): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    // Disable voice-call DSP that mangles instrument audio on phones
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
}

function missingDevice(error: unknown): boolean {
  return error instanceof DOMException
    && (error.name === "NotFoundError" || error.name === "OverconstrainedError");
}

export async function acquireMic(): Promise<MediaStream> {
  const selectedDeviceId = getSelectedAudioInputId();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints(selectedDeviceId),
    });
    notifyAudioInputsAvailable();
    return stream;
  } catch (error) {
    if (!selectedDeviceId || !missingDevice(error)) throw error;
    clearSelectedAudioInput();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints(null),
    });
    notifyAudioInputsAvailable();
    return stream;
  }
}

export function setupAudio(stream: MediaStream): {
  ctx: AudioContext;
  node: AnalyserNode;
} {
  const ctx = new AudioContext();
  const node = ctx.createAnalyser();
  node.fftSize = BUFFER_SIZE;
  ctx.createMediaStreamSource(stream).connect(node);
  return { ctx, node };
}

export function releaseMic(
  mediaStream: MediaStream | null,
  audioContext: AudioContext | null,
): void {
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop();
  }
  if (audioContext) {
    void audioContext.close();
  }
}

/** Compute RMS amplitude of a buffer to gate out weak/decaying signals */
export function computeRms(buffer: Float32Array): number {
  let sum = 0;
  for (const sample of buffer) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}
