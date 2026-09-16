import { MAJOR_SCALE, MINOR_SCALE } from "../../shared/constants";
import type { ScaleType } from "../../shared/types";
import {
  getTriadShapes,
  type TriadQuality,
  type TriadShape,
  type TriadStringSet,
} from "./shapes";

export type ProgressionDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProgressionStep {
  readonly degree: ProgressionDegree;
  readonly quality: TriadQuality;
}

export interface ProgressionChord extends ProgressionStep {
  readonly rootIndex: number;
}

const ROMAN_NUMERALS: Record<ProgressionDegree, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
};

export function progressionStepLabel(step: ProgressionStep): string {
  const numeral = ROMAN_NUMERALS[step.degree];
  if (step.quality === "diminished") return `${numeral.toLowerCase()}°`;
  return step.quality === "minor" ? numeral.toLowerCase() : numeral;
}

export function getProgressionChord(
  keyRootIndex: number,
  scaleType: ScaleType,
  step: ProgressionStep,
): ProgressionChord {
  const intervals = scaleType === "major" ? MAJOR_SCALE : MINOR_SCALE;
  return {
    ...step,
    rootIndex: (keyRootIndex + intervals[step.degree - 1]) % 12,
  };
}

function shapeDistance(first: TriadShape, second: TriadShape): number {
  return first.notes.reduce((total, note, index) =>
    total + Math.abs(note.fret - second.notes[index].fret), 0);
}

function groupingCost(shapes: readonly TriadShape[]): number {
  return shapes.reduce((total, shape, index) => {
    const nextShape = shapes[(index + 1) % shapes.length];
    return total + shapeDistance(shape, nextShape);
  }, 0);
}

function findGroupingForAnchor(
  candidates: readonly TriadShape[][],
  anchor: TriadShape,
): TriadShape[] {
  let bestShapes: TriadShape[] = [];
  let bestCost = Number.POSITIVE_INFINITY;

  function visit(stepIndex: number, selected: TriadShape[]): void {
    if (stepIndex === candidates.length) {
      const cost = groupingCost(selected);
      if (cost < bestCost) {
        bestCost = cost;
        bestShapes = [...selected];
      }
      return;
    }
    for (const shape of candidates[stepIndex]) {
      selected.push(shape);
      visit(stepIndex + 1, selected);
      selected.pop();
    }
  }

  visit(1, [anchor]);
  return bestShapes;
}

/**
 * Build a nearest-voicing loop around every occurrence of the first chord, so
 * compact progression groups remain available across the whole fretboard.
 */
export function getNearestTriadGroupings(
  chords: readonly ProgressionChord[],
  stringSet: TriadStringSet,
): TriadShape[][] {
  const candidates = chords.map((chord) =>
    getTriadShapes(chord.rootIndex, chord.quality, stringSet));
  const anchors = candidates[0] ?? [];
  return anchors.map((anchor) => findGroupingForAnchor(candidates, anchor));
}
