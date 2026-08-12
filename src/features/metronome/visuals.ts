// Beat dots and pendulum rendering for the metronome.

import type { AccentLevel } from "./beats";

/** Maximum pendulum deflection from vertical, in degrees. */
const MAX_ANGLE = 30;

export function renderBeatDots(
  container: HTMLElement,
  accents: AccentLevel[],
): void {
  container.innerHTML = accents
    .map(
      (accent, i) =>
        `<button class="metronome-beat metronome-beat-${accent}" data-beat="${i}" aria-label="Beat ${i + 1}: ${accent}"></button>`,
    )
    .join("");
}

export function highlightBeat(
  container: HTMLElement,
  beat: number | null,
): void {
  const dots = container.querySelectorAll(".metronome-beat");
  for (const [i, dot] of dots.entries()) {
    dot.classList.toggle("current", i === beat);
  }
}

/**
 * Pendulum angle for a point in time. The arm reaches an extreme exactly on
 * each beat, alternating sides, so `swings` is the (fractional) count of beats
 * elapsed since playback started.
 */
export function pendulumAngle(swings: number): number {
  return MAX_ANGLE * Math.cos(Math.PI * swings);
}

export function setPendulumAngle(arm: HTMLElement, angle: number): void {
  arm.style.transform = `rotate(${angle.toFixed(2)}deg)`;
}
