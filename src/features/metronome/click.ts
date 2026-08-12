// Synthesized metronome clicks: a short pitched blip with a fast decay.

export type ClickKind = "strong" | "weak" | "subdivision";

interface ClickSpec {
  frequency: number;
  gain: number;
  /** Decay time in seconds */
  decay: number;
}

const CLICK_SPECS: Record<ClickKind, ClickSpec> = {
  strong: { frequency: 1600, gain: 0.9, decay: 0.05 },
  weak: { frequency: 1100, gain: 0.55, decay: 0.04 },
  subdivision: { frequency: 780, gain: 0.28, decay: 0.03 },
};

/** Schedule a click at `time` on the given audio context clock. */
export function playClick(
  ctx: AudioContext,
  kind: ClickKind,
  time: number,
): void {
  const spec = CLICK_SPECS[kind];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(spec.frequency, time);

  // Exponential ramps cannot reach zero, so decay to a tiny floor instead.
  gain.gain.setValueAtTime(spec.gain, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + spec.decay);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + spec.decay + 0.01);
}
