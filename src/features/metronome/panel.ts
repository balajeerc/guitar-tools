// Static markup for the metronome page.

import {
  LARGE_BPM_STEP,
  MAX_BPM,
  MIN_BPM,
  SMALL_BPM_STEP,
  SUBDIVISIONS,
} from "./beats";

function subdivisionButtons(): string {
  return SUBDIVISIONS.map(
    ({ value, label }) =>
      `<button class="toggle-btn" id="metronomeSubdiv${value}Btn" data-subdivision="${value}">${label}</button>`,
  ).join("");
}

export function metronomePanelHtml(summary: string): string {
  return `
    <div class="controls-wrapper">
      <button class="controls-accordion-toggle" id="metronomeAccordionToggle">
        <span class="controls-summary" id="metronomeControlsSummary">${summary}</span>
        <span class="controls-accordion-arrow">&#9662;</span>
      </button>
      <div class="controls" id="metronome-controls">
        <div class="controls-row">
          <div class="control-group">
            <span class="control-label">Beats:</span>
            <div class="note-selector">
              <button class="note-btn" id="metronomeBeatsDown">&#10094;</button>
              <div class="note-display" id="metronomeBeatsDisplay">4</div>
              <button class="note-btn" id="metronomeBeatsUp">&#10095;</button>
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">Subdivision:</span>
            <div class="toggle-group">${subdivisionButtons()}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="metronome-display">
      <div class="metronome-pendulum">
        <div class="metronome-pendulum-arm" id="metronomePendulumArm">
          <div class="metronome-pendulum-bob"></div>
        </div>
        <div class="metronome-pendulum-pivot"></div>
      </div>

      <div class="metronome-tempo">
        <button class="note-btn" id="metronomeBpmDownLarge" aria-label="Decrease tempo by ${LARGE_BPM_STEP}">&#10094;&#10094;</button>
        <button class="note-btn" id="metronomeBpmDown" aria-label="Decrease tempo by ${SMALL_BPM_STEP}">&#10094;</button>
        <div class="metronome-bpm">
          <input class="metronome-bpm-value" id="metronomeBpmValue" type="text"
                 inputmode="numeric" pattern="[0-9]*" maxlength="3"
                 value="100" aria-label="Tempo in beats per minute">
          <span class="metronome-bpm-unit">BPM</span>
        </div>
        <button class="note-btn" id="metronomeBpmUp" aria-label="Increase tempo by ${SMALL_BPM_STEP}">&#10095;</button>
        <button class="note-btn" id="metronomeBpmUpLarge" aria-label="Increase tempo by ${LARGE_BPM_STEP}">&#10095;&#10095;</button>
      </div>

      <input class="metronome-slider" id="metronomeBpmSlider" type="range"
             min="${MIN_BPM}" max="${MAX_BPM}" step="1" value="100"
             aria-label="Tempo in beats per minute">

      <div class="metronome-beats" id="metronomeBeats"></div>
      <div class="metronome-hint">Tap a beat dot to cycle its accent: strong &rarr; weak &rarr; silent</div>

      <div class="metronome-actions">
        <button class="note-detection-btn" id="metronomeToggleBtn">Start</button>
      </div>
    </div>
  `;
}
