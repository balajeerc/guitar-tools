// Fret Walk rendering: click any position to anchor a root, then only the
// notes from that root UP to the next root (ascending, i.e. absolute pitches
// from the anchor through +12 semitones) are shown. A Major/Minor/Full toggle
// filters which notes appear (scale tones vs. full chromatic). Clicking one of
// the terminating (octave-up) roots extends the walk additively by another
// octave, so a chain of anchors walks up the neck. The fretboard starts blank
// until a note is clicked.

import type { DisplayMode } from "../../shared/types";
import {
  NOTES,
  MAJOR_SCALE,
  MINOR_SCALE,
  STRING_BASE_PITCH,
  TOTAL_FRETS,
  STRING_Y_POSITIONS,
  STRING_ORDER,
} from "../../shared/constants";
import { getNoteAtPosition } from "../../shared/musicTheory";
import {
  generateFretLinesHTML,
  generateDotsHTML,
  generateStringsHTML,
  generateFretNumbersHTML,
  fretCenterPosition,
  sizeCagedHeader,
} from "../../shared/fretboardRenderer";
import { getLayoutConfig, type LayoutConfig } from "../../shared/layout";

/** Scale filter for the visible notes. "full" = full chromatic. */
export type FretWalkMode = "major" | "minor" | "full";

export interface Anchor {
  /** String index 0-5 (0 = low E, 5 = high E) */
  readonly stringIdx: number;
  readonly fret: number;
}

interface IntervalInfo {
  readonly label: string;
  readonly className: string;
}

// Full-scale interval display, matching the Scales feature's "full" mode:
// root, 2, 3, 4, 5, 6, 7 (major) / R, 2, b3, 4, 5, b6, b7 (minor), with the
// same colour classes (pentatonic tones 2/6 and 4/b7 get the yellow tint).
const MAJOR_INTERVALS: IntervalInfo[] = [
  { label: "R", className: "interval-root" },
  { label: "2", className: "interval-pentatonic" },
  { label: "3", className: "interval-third" },
  { label: "4", className: "interval-other" },
  { label: "5", className: "interval-fifth" },
  { label: "6", className: "interval-pentatonic" },
  { label: "7", className: "interval-other" },
];

const MINOR_INTERVALS: IntervalInfo[] = [
  { label: "R", className: "interval-root" },
  { label: "2", className: "interval-other" },
  { label: "b3", className: "interval-third" },
  { label: "4", className: "interval-pentatonic" },
  { label: "5", className: "interval-fifth" },
  { label: "b6", className: "interval-other" },
  { label: "b7", className: "interval-pentatonic" },
];

// Chromatic interval names (flat-based) for "full" mode, indexed by semitone.
const CHROMATIC_INTERVALS: IntervalInfo[] = [
  { label: "R", className: "interval-root" },
  { label: "b2", className: "interval-other" },
  { label: "2", className: "interval-other" },
  { label: "b3", className: "interval-third" },
  { label: "3", className: "interval-third" },
  { label: "4", className: "interval-other" },
  { label: "b5", className: "interval-other" },
  { label: "5", className: "interval-fifth" },
  { label: "b6", className: "interval-other" },
  { label: "6", className: "interval-other" },
  { label: "b7", className: "interval-other" },
  { label: "7", className: "interval-other" },
];

/** Build a semitone -> IntervalInfo lookup for the given mode. */
function intervalLookup(mode: FretWalkMode): Map<number, IntervalInfo> {
  if (mode === "full") {
    return new Map(CHROMATIC_INTERVALS.map((info, i) => [i, info]));
  }
  const intervals = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const display = mode === "major" ? MAJOR_INTERVALS : MINOR_INTERVALS;
  return new Map(intervals.map((semitone, i) => [semitone, display[i]]));
}

/** Absolute pitch (in semitones from low E open) of a fret position. */
function absolutePitch(stringIdx: number, fret: number): number {
  return STRING_BASE_PITCH[stringIdx] + fret;
}

/** Absolute pitch of an anchor. */
export function anchorPitch(anchor: Anchor): number {
  return absolutePitch(anchor.stringIdx, anchor.fret);
}

/** A unique key for an anchor position, for set membership. */
function anchorKey(stringIdx: number, fret: number): string {
  return `${stringIdx}:${fret}`;
}

/**
 * The active selection derived from the anchor chain: the ascending pitch range
 * [basePitch .. topPitch] to display, plus the set of clicked anchor positions
 * (rendered as root "waypoint" squares). Anchors are always octaves apart, so
 * they share a single root pitch class and the range is contiguous.
 */
interface Selection {
  readonly basePitch: number;
  readonly topPitch: number;
  readonly anchorKeys: ReadonlySet<string>;
}

function buildSelection(anchors: readonly Anchor[]): Selection | null {
  if (anchors.length === 0) return null;
  const basePitch = anchorPitch(anchors[0]);
  const topPitch = anchorPitch(anchors[anchors.length - 1]) + 12;
  const anchorKeys = new Set(
    anchors.map((a) => anchorKey(a.stringIdx, a.fret)),
  );
  return { basePitch, topPitch, anchorKeys };
}

/** Semitone offset (0-11) of a pitch from the selection's root. */
function deltaFromBase(pitch: number, basePitch: number): number {
  return (((pitch - basePitch) % 12) + 12) % 12;
}

/** Pixel centre (cx, cy) of a note in the current layout. */
function noteCoord(
  stringIdx: number,
  fret: number,
  config: LayoutConfig,
): { cx: number; cy: number } {
  const visualIdx = STRING_ORDER.indexOf(stringIdx);
  const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
  const stringPos = STRING_Y_POSITIONS[posIdx];
  const fretPos = fretCenterPosition(fret, config);
  return config.isVertical
    ? { cx: stringPos, cy: fretPos }
    : { cx: fretPos, cy: stringPos };
}

interface NoteRenderOptions {
  readonly stringIdx: number;
  readonly stringPos: number;
  readonly fret: number;
  readonly sel: Selection;
  readonly lookup: Map<number, IntervalInfo>;
  readonly displayMode: DisplayMode;
  readonly config: LayoutConfig;
}

function generateNoteHTML(opts: NoteRenderOptions): string {
  const { stringIdx, stringPos, fret, sel, lookup, displayMode, config } = opts;

  // Only show notes within the ascending root-to-root range.
  const pitch = absolutePitch(stringIdx, fret);
  if (pitch < sel.basePitch || pitch > sel.topPitch) return "";

  const delta = deltaFromBase(pitch, sel.basePitch);
  const info = lookup.get(delta);
  // Filter out notes not in the selected scale (major/minor modes).
  if (!info) return "";

  const noteIndex = getNoteAtPosition(stringIdx, fret);
  const fretPos = fretCenterPosition(fret, config);
  const posStyle = `${config.fretAxis}: ${fretPos}px; ${config.stringAxis}: ${stringPos}px;`;
  const dataAttrs = `data-string="${stringIdx}" data-fret="${fret}"`;

  // Clicked anchors are rendered as red "waypoint" squares; other roots stay as
  // ordinary root markers.
  const isAnchor = sel.anchorKeys.has(anchorKey(stringIdx, fret));

  if (displayMode === "intervals") {
    const cls = isAnchor
      ? "note note-square interval-root"
      : `note ${info.className}`;
    return `<div class="${cls}" style="${posStyle}" ${dataAttrs}>${info.label}</div>`;
  }

  // Notes mode.
  const cls = isAnchor ? "note note-square interval-root" : "note note-circle";
  return `<div class="${cls}" style="${posStyle}" ${dataAttrs}>${NOTES[noteIndex]}</div>`;
}

function generateNotesHTML(
  sel: Selection | null,
  displayMode: DisplayMode,
  mode: FretWalkMode,
  config: LayoutConfig,
): string {
  // No anchor → blank fretboard (clicks are handled at the board level).
  if (!sel) return "";

  const lookup = intervalLookup(mode);
  let html = "";
  for (const [visualIdx, stringIdx] of STRING_ORDER.entries()) {
    // In vertical mode, reverse positions so bass strings are on the left (EADGBE)
    const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
    const stringPos = STRING_Y_POSITIONS[posIdx];

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      html += generateNoteHTML({
        stringIdx,
        stringPos,
        fret,
        sel,
        lookup,
        displayMode,
        config,
      });
    }
  }
  return html;
}

interface WalkPoint {
  readonly pitch: number;
  readonly cx: number;
  readonly cy: number;
}

interface Coord {
  readonly cx: number;
  readonly cy: number;
}

/** Squared distance between two points (ordering only, no sqrt needed). */
function distSq(a: Coord, b: Coord): number {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  return dx * dx + dy * dy;
}

/** The shown point nearest to `from` among candidates, or null if none. */
function nearestPoint(candidates: WalkPoint[], from: Coord): WalkPoint | null {
  let best: WalkPoint | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = distSq(c, from);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/** Every shown (in-range, in-scale) position with its pixel coordinates. */
function collectWalkPoints(
  sel: Selection,
  mode: FretWalkMode,
  config: LayoutConfig,
): WalkPoint[] {
  const lookup = intervalLookup(mode);
  const points: WalkPoint[] = [];
  for (const stringIdx of STRING_ORDER) {
    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const pitch = absolutePitch(stringIdx, fret);
      if (pitch < sel.basePitch || pitch > sel.topPitch) continue;
      if (!lookup.has(deltaFromBase(pitch, sel.basePitch))) continue;
      points.push({ pitch, ...noteCoord(stringIdx, fret, config) });
    }
  }
  return points;
}

/**
 * Build an ascending "walk" polyline through the selection: starting at the
 * first anchor, step up through each scale pitch, threading through the clicked
 * anchor waypoints and otherwise choosing the shown position nearest to the
 * previous note so the path stays smooth. Returns an SVG overlay string.
 */
function generateWalkPathSVG(
  anchors: readonly Anchor[],
  sel: Selection,
  mode: FretWalkMode,
  config: LayoutConfig,
): string {
  const points = collectWalkPoints(sel, mode, config);

  // Forced waypoint coord per clicked anchor pitch (anchors are octave-distinct).
  const forced = new Map<number, Coord>(
    anchors.map((a) => [anchorPitch(a), noteCoord(a.stringIdx, a.fret, config)]),
  );

  const pitches = [...new Set(points.map((p) => p.pitch))].sort((a, b) => a - b);

  const start = forced.get(sel.basePitch);
  if (!start) return "";
  let prev: Coord = start;

  const segments: string[] = [];
  for (const pitch of pitches) {
    if (pitch === sel.basePitch) continue; // start point, no incoming line
    const chosen: Coord | null =
      forced.get(pitch) ??
      nearestPoint(
        points.filter((p) => p.pitch === pitch),
        prev,
      );
    if (!chosen) continue;
    segments.push(
      `<line x1="${prev.cx}" y1="${prev.cy}" x2="${chosen.cx}" y2="${chosen.cy}" />`,
    );
    prev = chosen;
  }

  if (segments.length === 0) return "";
  return `<svg class="fret-walk-path" xmlns="http://www.w3.org/2000/svg">${segments.join("")}</svg>`;
}

/**
 * Render the CAGED-style header showing the root note's letter above the first
 * anchor's fret column. Reuses the Scales feature's `.caged-header` /
 * `.shape-label` styling. Cleared when no anchor is set.
 */
function renderFretWalkHeader(anchors: readonly Anchor[]): void {
  const header = document.getElementById("fret-walk-header");
  if (!header) return;

  const config = getLayoutConfig();
  sizeCagedHeader(header, config);

  if (anchors.length === 0) {
    header.innerHTML = "";
    return;
  }

  const first = anchors[0];
  const noteIndex = getNoteAtPosition(first.stringIdx, first.fret);
  const noteName = NOTES[noteIndex];
  const pos = fretCenterPosition(first.fret, config);

  header.innerHTML = `
    <div class="shape-label" style="position: absolute; ${config.fretAxis}: ${pos}px;" data-shape="${noteName}">
      <span class="shape-letter">${noteName}</span>
      <span class="shape-text">root</span>
      <div class="shape-line" style="background-color: var(--color-primary);"></div>
    </div>`;
}

/**
 * Render the Fret Walk fretboard. The board is blank until an anchor is set;
 * once set, only notes from the root up to the next root(s) — filtered by the
 * selected scale mode — are shown, with clicked anchors styled as root
 * waypoints and an ascending walk line connecting the notes.
 */
export function renderFretWalk(
  anchors: readonly Anchor[],
  displayMode: DisplayMode,
  mode: FretWalkMode,
): void {
  const fretboard = document.getElementById("fret-walk-fretboard");
  const fretNumbers = document.getElementById("fret-walk-fretNumbers");
  if (!fretboard || !fretNumbers) return;

  const config = getLayoutConfig();
  const sel = buildSelection(anchors);

  let html = "";
  html += generateFretLinesHTML(config);
  html += generateDotsHTML(config);
  html += generateStringsHTML(config);
  if (sel) html += generateWalkPathSVG(anchors, sel, mode, config);
  html += generateNotesHTML(sel, displayMode, mode, config);

  fretboard.innerHTML = html;
  fretNumbers.innerHTML = generateFretNumbersHTML(config);

  renderFretWalkHeader(anchors);
}

/** Human-readable description of the anchor for the info line. */
export function describeAnchor(anchor: Anchor): string {
  const noteIndex = getNoteAtPosition(anchor.stringIdx, anchor.fret);
  const stringNames = ["Low E", "A", "D", "G", "B", "High E"];
  const fretLabel = anchor.fret === 0 ? "open" : `fret ${anchor.fret}`;
  return `${NOTES[noteIndex]} · ${stringNames[anchor.stringIdx]} string · ${fretLabel}`;
}
