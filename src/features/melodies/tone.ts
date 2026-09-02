export type MelodyTone = "warm" | "pure" | "bright" | "pluck";

export interface MelodyToneProfile {
  oscillator: OscillatorType;
  filterHz: number;
  peakGain: number;
  sustainGain: number;
  attackSeconds: number;
  releaseRatio: number;
}

export const MELODY_TONES = [
  { value: "warm", label: "Warm" },
  { value: "pure", label: "Pure" },
  { value: "bright", label: "Bright" },
  { value: "pluck", label: "Pluck" },
] as const;

const PROFILES: Readonly<Record<MelodyTone, MelodyToneProfile>> = {
  warm: {
    oscillator: "triangle", filterHz: 2200, peakGain: 0.32, sustainGain: 0.24,
    attackSeconds: 0.015, releaseRatio: 0.3,
  },
  pure: {
    oscillator: "sine", filterHz: 4000, peakGain: 0.3, sustainGain: 0.27,
    attackSeconds: 0.012, releaseRatio: 0.24,
  },
  bright: {
    oscillator: "sawtooth", filterHz: 2800, peakGain: 0.17, sustainGain: 0.11,
    attackSeconds: 0.008, releaseRatio: 0.34,
  },
  pluck: {
    oscillator: "triangle", filterHz: 3200, peakGain: 0.34, sustainGain: 0.045,
    attackSeconds: 0.005, releaseRatio: 0.18,
  },
};

export function isMelodyTone(value: unknown): value is MelodyTone {
  return MELODY_TONES.some((option) => option.value === value);
}

export function melodyToneProfile(tone: MelodyTone): MelodyToneProfile {
  return PROFILES[tone];
}
