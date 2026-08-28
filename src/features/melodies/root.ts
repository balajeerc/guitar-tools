const NATURAL_ROOTS: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const SEMITONES_PER_OCTAVE = 12;

export function rootNameFromKey(key: string): string {
  return key.split(" ")[0] ?? key;
}

function rootPitchClass(key: string): number {
  const root = rootNameFromKey(key);
  const natural = NATURAL_ROOTS[root.charAt(0)] ?? 0;
  if (root.includes("♭") || root.includes("b")) return (natural + 11) % SEMITONES_PER_OCTAVE;
  if (root.includes("♯") || root.includes("#")) return (natural + 1) % SEMITONES_PER_OCTAVE;
  return natural;
}

export function rootDisplacementLabel(midi: number, key: string): string {
  const displacement = ((midi - rootPitchClass(key)) % SEMITONES_PER_OCTAVE + SEMITONES_PER_OCTAVE)
    % SEMITONES_PER_OCTAVE;
  if (displacement === 0) return "At the target root";
  const unit = displacement === 1 ? "semitone" : "semitones";
  return `${displacement} ${unit} above the target root`;
}
