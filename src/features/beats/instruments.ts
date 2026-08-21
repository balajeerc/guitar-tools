import type { DrumVoice, TrackLevels } from "./pattern";

export interface DrumKit {
  play: (voice: DrumVoice, time: number, level: number) => void;
  disconnect: () => void;
}

function connectEnvelope(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  peak: number,
  decay: number,
): GainNode {
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.linearRampToValueAtTime(peak, time + 0.002);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  envelope.connect(destination);
  return envelope;
}

function playKick(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  level: number,
): void {
  const oscillator = ctx.createOscillator();
  const envelope = connectEnvelope(ctx, destination, time, level, 0.32);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(155, time);
  oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.11);
  oscillator.connect(envelope);
  oscillator.start(time);
  oscillator.stop(time + 0.34);
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  const randomValues = new Uint32Array(samples.length);
  const maximumRandomValues = 16_384;
  for (let offset = 0; offset < randomValues.length; offset += maximumRandomValues) {
    const end = Math.min(offset + maximumRandomValues, randomValues.length);
    crypto.getRandomValues(randomValues.subarray(offset, end));
  }
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = (randomValues[index] / 0xffff_ffff) * 2 - 1;
  }
  return buffer;
}

function playFilteredNoise(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  options: { time: number; level: number; decay: number; frequency: number },
): void {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = connectEnvelope(
    ctx,
    destination,
    options.time,
    options.level,
    options.decay,
  );
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.setValueAtTime(options.frequency, options.time);
  source.connect(filter);
  filter.connect(envelope);
  source.start(options.time);
  source.stop(options.time + options.decay + 0.02);
}

function playSnareBody(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  level: number,
): void {
  const oscillator = ctx.createOscillator();
  const envelope = connectEnvelope(ctx, destination, time, level * 0.35, 0.12);
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(190, time);
  oscillator.frequency.exponentialRampToValueAtTime(125, time + 0.1);
  oscillator.connect(envelope);
  oscillator.start(time);
  oscillator.stop(time + 0.14);
}

function playSnare(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  level: number,
): void {
  playFilteredNoise(ctx, destination, buffer, {
    time,
    level: level * 0.75,
    decay: 0.16,
    frequency: 1400,
  });
  playSnareBody(ctx, destination, time, level);
}

function playHihat(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  level: number,
): void {
  playFilteredNoise(ctx, destination, buffer, {
    time,
    level,
    decay: 0.055,
    frequency: 6800,
  });
}

function playCrash(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  level: number,
): void {
  playFilteredNoise(ctx, destination, buffer, {
    time,
    level,
    decay: 1.35,
    frequency: 3200,
  });
}

export function createDrumKit(ctx: AudioContext): DrumKit {
  const compressor = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  const noise = createNoiseBuffer(ctx);
  master.gain.value = 0.72;
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.2;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  function play(voice: DrumVoice, time: number, level: number): void {
    if (voice === "kick") playKick(ctx, master, time, level);
    if (voice === "snare") playSnare(ctx, master, noise, time, level);
    if (voice === "hihat") playHihat(ctx, master, noise, time, level);
    if (voice === "crash") playCrash(ctx, master, noise, time, level);
  }

  function disconnect(): void {
    master.disconnect();
    compressor.disconnect();
  }

  return { play, disconnect };
}

export function voicesAtStep(
  pattern: Record<DrumVoice, boolean[]>,
  levels: TrackLevels,
  step: number,
): { voice: DrumVoice; level: number }[] {
  const voices: DrumVoice[] = ["kick", "snare", "hihat", "crash"];
  return voices
    .filter((voice) => pattern[voice][step])
    .map((voice) => ({ voice, level: levels[voice] }));
}
