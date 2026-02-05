// Type definitions for guitar scale visualization

export type CAGEDShape = "C" | "A" | "G" | "E" | "D";
export type ScaleType = "major" | "minor";
export type DisplayMode = "notes" | "intervals";

interface StringRange {
  min: number;
  max: number;
}

export interface CAGEDPattern {
  stringRanges: StringRange[];
}

export type CAGEDPatterns = Record<CAGEDShape, CAGEDPattern>;
