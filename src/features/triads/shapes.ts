import type { ScaleType } from "../../shared/types";
import { STRING_BASE_PITCH, TOTAL_FRETS } from "../../shared/constants";

export type TriadDegree = "root" | "third" | "fifth";
export type TriadInversion = "root" | "first" | "second";
export type OrbitDegree = "minorThird" | "majorThird" | "flatSeventh";

export interface TriadStringSet {
  readonly id: string;
  readonly label: string;
  readonly tuning: string;
  readonly stringIndices: readonly [number, number, number];
}

export interface TriadNotePosition {
  readonly degree: TriadDegree;
  readonly stringIdx: number;
  readonly fret: number;
}

export interface TriadShape {
  readonly id: string;
  readonly inversion: TriadInversion;
  readonly notes: readonly TriadNotePosition[];
  readonly centerFret: number;
}

export interface OrbitNotePosition {
  readonly degree: OrbitDegree;
  readonly stringIdx: number;
  readonly fret: number;
  readonly sourceFret: number;
}

export const TRIAD_STRING_SETS: readonly TriadStringSet[] = [
  { id: "strings-1-3", label: "Strings 1–3", tuning: "G–B–E", stringIndices: [3, 4, 5] },
  { id: "strings-2-4", label: "Strings 2–4", tuning: "D–G–B", stringIndices: [2, 3, 4] },
  { id: "strings-3-5", label: "Strings 3–5", tuning: "A–D–G", stringIndices: [1, 2, 3] },
  { id: "strings-4-6", label: "Strings 4–6", tuning: "E–A–D", stringIndices: [0, 1, 2] },
];

const DEGREE_ORDERS: Record<TriadInversion, readonly TriadDegree[]> = {
  root: ["root", "third", "fifth"],
  first: ["third", "fifth", "root"],
  second: ["fifth", "root", "third"],
};

const INVERSIONS: readonly TriadInversion[] = ["root", "first", "second"];

// These neighboring tones reproduce the compact "blues cluster" surrounding
// each inversion: R, b3, 3, 5, b7. The b7 is available on both sides of the
// shape, two frets below the root and three frets above the fifth.
const ORBIT_RULES: Record<ScaleType, Record<TriadDegree, {
  readonly degree: OrbitDegree;
  readonly fretOffset: number;
}>> = {
  major: {
    root: { degree: "flatSeventh", fretOffset: -2 },
    third: { degree: "minorThird", fretOffset: -1 },
    fifth: { degree: "flatSeventh", fretOffset: 3 },
  },
  minor: {
    root: { degree: "flatSeventh", fretOffset: -2 },
    third: { degree: "majorThird", fretOffset: 1 },
    fifth: { degree: "flatSeventh", fretOffset: 3 },
  },
};

function degreeSemitones(scaleType: ScaleType): Record<TriadDegree, number> {
  return { root: 0, third: scaleType === "major" ? 4 : 3, fifth: 7 };
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function createShape(
  bassPitch: number,
  inversion: TriadInversion,
  stringSet: TriadStringSet,
  semitones: Record<TriadDegree, number>,
): TriadShape | null {
  const order = DEGREE_ORDERS[inversion];
  const bassSemitones = semitones[order[0]];
  const notes = order.map((degree, index) => {
    const targetPitch = bassPitch + positiveModulo(semitones[degree] - bassSemitones, 12);
    const stringIdx = stringSet.stringIndices[index];
    return { degree, stringIdx, fret: targetPitch - (STRING_BASE_PITCH[stringIdx] + 7) };
  });

  if (notes.some(({ fret }) => fret < 0 || fret > TOTAL_FRETS)) return null;
  const frets = notes.map(({ fret }) => fret);
  const centerFret = (Math.min(...frets) + Math.max(...frets)) / 2;
  return {
    id: `${stringSet.id}-${inversion}-${bassPitch}`,
    inversion,
    notes,
    centerFret,
  };
}

export function getTriadShapes(
  rootIndex: number,
  scaleType: ScaleType,
  stringSet: TriadStringSet,
): TriadShape[] {
  const semitones = degreeSemitones(scaleType);
  const shapes: TriadShape[] = [];
  const lowestPitch = Math.min(...stringSet.stringIndices.map((i) => STRING_BASE_PITCH[i] + 7));
  const highestPitch = Math.max(...stringSet.stringIndices.map((i) => STRING_BASE_PITCH[i] + 7 + TOTAL_FRETS));

  for (const inversion of INVERSIONS) {
    const bassPitchClass = (rootIndex + semitones[DEGREE_ORDERS[inversion][0]]) % 12;
    for (let bassPitch = bassPitchClass; bassPitch <= highestPitch; bassPitch += 12) {
      if (bassPitch < lowestPitch - 12) continue;
      const shape = createShape(bassPitch, inversion, stringSet, semitones);
      if (shape) shapes.push(shape);
    }
  }

  return shapes.sort((a, b) => a.centerFret - b.centerFret);
}

export function getOrbitNotes(shape: TriadShape, scaleType: ScaleType): OrbitNotePosition[] {
  return shape.notes.flatMap(({ degree, stringIdx, fret }) => {
    const rule = ORBIT_RULES[scaleType][degree];
    const orbitFret = fret + rule.fretOffset;
    if (orbitFret < 0 || orbitFret > TOTAL_FRETS) return [];
    return [{
      degree: rule.degree,
      stringIdx,
      fret: orbitFret,
      sourceFret: fret,
    }];
  });
}
