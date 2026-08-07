// Renders the Circle of Fifths wheel: an outer ring of major keys, a middle
// ring of their relative minors, and a hub showing the current selection.

import { CIRCLE_KEYS, type CircleKey } from "./constants";
import { getWheelNumerals, sliceKey } from "./degreeSlots";
import type { KeyMode } from "./theory";

const CENTER = 200;
const R_OUTER = 190;
const R_MID = 116;
// The minor band runs R_INNER..R_MID; it takes its extra width from the hub so
// the major ring keeps the room its alternate spellings and numerals need.
const R_INNER = 62;
const MAJOR_LABEL_R = 152;
const MINOR_LABEL_R = 88;
/** How far inside the preferred spelling the enharmonic alternative sits */
const ALT_LABEL_OFFSET = 21;
const SECTOR_ANGLE = 360 / CIRCLE_KEYS.length;

/** Where each ring's roman numeral sits: on its label's radius, and how far below it. */
const NUMERAL_LAYOUT: Record<KeyMode, { radius: number; offset: number }> = {
  major: { radius: MAJOR_LABEL_R, offset: 19 },
  minor: { radius: MINOR_LABEL_R, offset: 13 },
};

export interface WheelSelection {
  readonly index: number;
  readonly mode: KeyMode;
  readonly degrees: readonly number[];
}

function fmt(value: number): string {
  return value.toFixed(2);
}

/** Cartesian point at `radius`, `angle` degrees clockwise from 12 o'clock. */
function point(radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [
    CENTER + radius * Math.cos(radians),
    CENTER + radius * Math.sin(radians),
  ];
}

/** Path data for an annulus sector spanning `start`..`end` degrees. */
function sectorPath(
  rInner: number,
  rOuter: number,
  start: number,
  end: number,
): string {
  const [x1, y1] = point(rOuter, start);
  const [x2, y2] = point(rOuter, end);
  const [x3, y3] = point(rInner, end);
  const [x4, y4] = point(rInner, start);
  return [
    `M${fmt(x1)},${fmt(y1)}`,
    `A${rOuter},${rOuter} 0 0,1 ${fmt(x2)},${fmt(y2)}`,
    `L${fmt(x3)},${fmt(y3)}`,
    `A${rInner},${rInner} 0 0,0 ${fmt(x4)},${fmt(y4)}`,
    "Z",
  ].join(" ");
}

function sectorMarkup(
  rInner: number,
  rOuter: number,
  index: number,
  mode: KeyMode,
  selected: boolean,
): string {
  const start = index * SECTOR_ANGLE - SECTOR_ANGLE / 2;
  const path = sectorPath(rInner, rOuter, start, start + SECTOR_ANGLE);
  return `<path class="cof-sector${selected ? " selected" : ""}" data-index="${index}" data-mode="${mode}" d="${path}" />`;
}

function label(
  text: string,
  radius: number,
  angle: number,
  className: string,
): string {
  const [x, y] = point(radius, angle);
  return `<text class="${className}" x="${fmt(x)}" y="${fmt(y)}">${text}</text>`;
}

/** The major-key label, preceded by its enharmonic alternative where one exists. */
function majorLabels(key: CircleKey, angle: number, selected: boolean): string {
  const state = selected ? " selected" : "";
  const preferred = label(
    key.major,
    MAJOR_LABEL_R,
    angle,
    `cof-label cof-label-major${state}`,
  );
  if (!key.majorAlt) return preferred;

  const alt = label(
    key.majorAlt,
    MAJOR_LABEL_R - ALT_LABEL_OFFSET,
    angle,
    `cof-label cof-label-alt${state}`,
  );
  return alt + preferred;
}

/**
 * A degree's roman numeral, sitting just below the key name. Offset straight
 * down the screen rather than radially, so it reads as a subtitle at every
 * position on the wheel.
 */
function numeralLabel(
  numeral: string | undefined,
  ring: KeyMode,
  angle: number,
  selected: boolean,
): string {
  if (!numeral) return "";

  const { radius, offset } = NUMERAL_LAYOUT[ring];
  const [x, y] = point(radius, angle);
  const state = selected ? " selected" : "";
  return `<text class="cof-numeral cof-numeral-${ring}${state}" x="${fmt(x)}" y="${fmt(y + offset)}">${numeral}</text>`;
}

function centerLabel(selection: WheelSelection): string {
  const key = CIRCLE_KEYS[selection.index];
  return selection.mode === "major" ? key.major : `${key.minor}m`;
}

export function renderWheel(selection: WheelSelection): string {
  const sectors: string[] = [];
  const labels: string[] = [];
  const numerals = getWheelNumerals(
    selection.index,
    selection.mode,
    selection.degrees,
  );

  for (const [index, key] of CIRCLE_KEYS.entries()) {
    const angle = index * SECTOR_ANGLE;
    const majorOn = selection.mode === "major" && selection.index === index;
    const minorOn = selection.mode === "minor" && selection.index === index;

    sectors.push(
      sectorMarkup(R_MID, R_OUTER, index, "major", majorOn),
      sectorMarkup(R_INNER, R_MID, index, "minor", minorOn),
    );
    labels.push(
      majorLabels(key, angle, majorOn),
      numeralLabel(numerals.get(sliceKey("major", index)), "major", angle, majorOn),
      label(
        `${key.minor}m`,
        MINOR_LABEL_R,
        angle,
        `cof-label cof-label-minor${minorOn ? " selected" : ""}`,
      ),
      numeralLabel(numerals.get(sliceKey("minor", index)), "minor", angle, minorOn),
    );
  }

  return `
    <svg class="cof-wheel" viewBox="0 0 400 400" role="img" aria-label="Circle of fifths">
      <g class="cof-sectors">${sectors.join("")}</g>
      <circle class="cof-hub" cx="${CENTER}" cy="${CENTER}" r="${R_INNER}" />
      <g class="cof-rings">
        <circle cx="${CENTER}" cy="${CENTER}" r="${R_OUTER}" />
        <circle cx="${CENTER}" cy="${CENTER}" r="${R_MID}" />
        <circle cx="${CENTER}" cy="${CENTER}" r="${R_INNER}" />
      </g>
      <g class="cof-labels">${labels.join("")}</g>
      <text class="cof-hub-label" x="${CENTER}" y="${CENTER}">${centerLabel(selection)}</text>
    </svg>
  `;
}
