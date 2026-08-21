import {
  DRUM_VOICE_INFO,
  STEP_COUNT,
  type BeatPattern,
  type DrumVoice,
  type TrackLevels,
} from "./pattern";

const STEP_LABELS = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];

function stepClass(step: number): string {
  return step % 4 === 0 ? " beats-beat-start" : "";
}

function headerHtml(): string {
  const labels = STEP_LABELS.map(
    (label, step) =>
      `<span class="beats-step-label${stepClass(step)}" style="--beats-row: ${step + 2}" data-step="${step}">${label}</span>`,
  ).join("");
  return `<span class="beats-corner" aria-hidden="true"></span>${labels}`;
}

function stepButtonHtml(
  voice: DrumVoice,
  label: string,
  track: number,
  step: number,
  active: boolean,
): string {
  const activeClass = active ? " active" : "";
  const beat = Math.floor(step / 4) + 1;
  const subdivision = STEP_LABELS[step];
  return `<button class="beats-cell${activeClass}${stepClass(step)}" style="--beats-row: ${step + 2}; --beats-column: ${track + 2}" data-voice="${voice}" data-step="${step}" aria-label="${label}, beat ${beat} ${subdivision}" aria-pressed="${active}"><span aria-hidden="true"></span></button>`;
}

function trackHtml(
  voice: DrumVoice,
  label: string,
  track: number,
  steps: boolean[],
): string {
  const cells = Array.from({ length: STEP_COUNT }, (_, step) =>
    stepButtonHtml(voice, label, track, step, steps[step]),
  ).join("");
  return `<span class="beats-track-label" style="--beats-column: ${track + 2}">${label}</span>${cells}`;
}

export function beatGridHtml(
  pattern: BeatPattern,
): string {
  const tracks = DRUM_VOICE_INFO.map(({ id, label }, track) =>
    trackHtml(id, label, track, pattern[id]),
  ).join("");
  return `<div class="beats-grid" role="group" aria-label="Drum pattern">${headerHtml()}${tracks}</div>`;
}

export function beatMixerHtml(levels: TrackLevels): string {
  const controls = DRUM_VOICE_INFO.map(
    ({ id, label }) => `
      <label class="beats-mixer-control">
        <span>${label}</span>
        <input class="beats-level" type="range" min="0" max="1" step="0.01" value="${levels[id]}" data-level="${id}" aria-label="${label} volume">
      </label>`,
  ).join("");
  return `<div class="beats-mixer" role="group" aria-label="Track levels">${controls}</div>`;
}

export function updateBeatCell(
  grid: HTMLElement,
  voice: DrumVoice,
  step: number,
  active: boolean,
): void {
  const cell = grid.querySelector<HTMLElement>(
    `.beats-cell[data-voice="${voice}"][data-step="${step}"]`,
  );
  cell?.classList.toggle("active", active);
  cell?.setAttribute("aria-pressed", String(active));
}

export function highlightGridStep(
  grid: HTMLElement,
  currentStep: number | null,
): void {
  const elements = grid.querySelectorAll<HTMLElement>("[data-step]");
  for (const element of elements) {
    element.classList.toggle(
      "current",
      currentStep !== null && Number(element.dataset.step) === currentStep,
    );
  }
}
