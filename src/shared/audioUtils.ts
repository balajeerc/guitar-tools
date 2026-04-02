// Shared audio utilities for microphone acquisition and pitch detection

const BUFFER_SIZE = 2048;

/** RMS amplitude below this is treated as silence */
export const SILENCE_THRESHOLD = 0.01;

export function acquireMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: true });
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
