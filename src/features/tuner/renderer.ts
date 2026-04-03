// Renderer for the Tuner feature — Fender-style meter gauge

import { METER_SEGMENTS, IN_TUNE_THRESHOLD } from "./constants";

/** Angle range: -75deg (left) to +75deg (right), 0 = center */
const MAX_ANGLE = 75;

/** Total segments: left + center + right (odd count so center bar is on the exact note) */
const TOTAL_SEGMENTS = METER_SEGMENTS * 2 + 1;

/** Needle easing factor per frame: 0 = frozen, 1 = instant. ~0.18 gives a smooth sweep. */
const NEEDLE_LERP = 0.18;

/** Current displayed needle angle (persists between frames) */
let currentAngle = 0;

/** Map cents (-50..+50) to needle angle */
function centsToAngle(cents: number): number {
  const clamped = Math.max(-50, Math.min(50, cents));
  return (clamped / 50) * MAX_ANGLE;
}

/** Build the colored arc segments for the meter gauge */
export function renderMeterSegments(container: SVGGElement): void {
  const cx = 150;
  const cy = 155;
  const innerR = 95;
  const outerR = 125;

  const sweep = MAX_ANGLE * 2; // total arc sweep
  const segAngle = sweep / TOTAL_SEGMENTS;
  const gapAngle = 0.5;

  const segments: string[] = [];

  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const a1 = -MAX_ANGLE + i * segAngle;
    const a2 = a1 + segAngle - gapAngle;

    // i=0 is leftmost, i=METER_SEGMENTS is center, i=TOTAL_SEGMENTS-1 is rightmost
    const distFromCenter = Math.abs(i - METER_SEGMENTS) / METER_SEGMENTS; // 0..1
    const color = getMeterColor(distFromCenter);

    const rad1 = ((a1 - 90) * Math.PI) / 180;
    const rad2 = ((a2 - 90) * Math.PI) / 180;

    const x1i = cx + innerR * Math.cos(rad1);
    const y1i = cy + innerR * Math.sin(rad1);
    const x1o = cx + outerR * Math.cos(rad1);
    const y1o = cy + outerR * Math.sin(rad1);
    const x2i = cx + innerR * Math.cos(rad2);
    const y2i = cy + innerR * Math.sin(rad2);
    const x2o = cx + outerR * Math.cos(rad2);
    const y2o = cy + outerR * Math.sin(rad2);

    segments.push(
      `<path d="M${x1i},${y1i} L${x1o},${y1o} A${outerR},${outerR} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${innerR},${innerR} 0 0,0 ${x1i},${y1i}" fill="${color}" opacity="0.85" data-segment="${i}" />`
    );
  }

  container.innerHTML = segments.join("");
}

/** Get color for a meter segment based on distance from center (0=center, 1=edge) */
function getMeterColor(dist: number): string {
  if (dist < 0.15) return "#4caf50";  // green - center
  if (dist < 0.35) return "#8bc34a";  // light green
  if (dist < 0.55) return "#cddc39";  // yellow-green
  if (dist < 0.75) return "#ff9800";  // orange
  return "#f44336";                    // red - edges
}

/** Update the needle position based on cents offset, with smooth easing */
export function updateNeedle(
  needle: SVGLineElement,
  centsOff: number | null,
): void {
  const targetAngle = centsOff !== null ? centsToAngle(centsOff) : 0;

  // Lerp toward target for a smooth, weighted sweep
  currentAngle += (targetAngle - currentAngle) * NEEDLE_LERP;

  needle.setAttribute(
    "transform",
    `rotate(${currentAngle}, 150, 155)`,
  );

  // Dim needle when idle
  needle.style.opacity = centsOff !== null ? "1" : "0.25";
}

/** Update the note name display */
export function updateTunerNoteDisplay(
  noteEl: HTMLElement,
  centsEl: HTMLElement,
  noteName: string | null,
  centsOff: number | null,
): void {
  noteEl.textContent = noteName ?? "-";

  if (centsOff !== null) {
    const sign = centsOff >= 0 ? "+" : "";
    centsEl.textContent = `${sign}${centsOff}¢`;
    const inTune = Math.abs(centsOff) <= IN_TUNE_THRESHOLD;
    centsEl.className = `tuner-cents ${inTune ? "in-tune" : "out-of-tune"}`;
  } else {
    centsEl.textContent = "";
    centsEl.className = "tuner-cents";
  }
}

/** Highlight the active string button and dim others */
export function updateStringHighlight(
  container: HTMLElement,
  activeIndex: number | null,
): void {
  const buttons = container.querySelectorAll(".tuner-string-btn");
  for (const btn of buttons) {
    const idx = Number((btn as HTMLElement).dataset.string);
    btn.classList.toggle("active", activeIndex !== null && idx === activeIndex);
  }
}

/** Highlight meter segments to show lit vs unlit based on cents */
export function updateMeterGlow(
  segmentsEl: SVGGElement,
  centsOff: number | null,
): void {
  const paths = segmentsEl.querySelectorAll("path");
  const centerIdx = METER_SEGMENTS; // middle segment index

  if (centsOff === null) {
    for (const path of paths) {
      path.setAttribute("opacity", "0.2");
    }
    return;
  }

  // Map cents (-50..+50) to segment index (0..TOTAL_SEGMENTS-1)
  const normalized = (centsOff + 50) / 100; // 0..1
  const activeIdx = Math.round(normalized * (TOTAL_SEGMENTS - 1));

  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    // Light up segments from center toward the needle position
    const isLit =
      (activeIdx >= centerIdx && i >= centerIdx && i <= activeIdx) ||
      (activeIdx < centerIdx && i <= centerIdx && i >= activeIdx);

    paths[i].setAttribute("opacity", isLit ? "0.9" : "0.2");
  }
}
