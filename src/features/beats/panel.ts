import {
  LARGE_BPM_STEP,
  MAX_BPM,
  MIN_BPM,
  SMALL_BPM_STEP,
} from "../metronome/beats";
import type { BeatPattern, TrackLevels } from "./pattern";
import { beatGridHtml, beatMixerHtml } from "./renderer";

export function beatsPanelHtml(
  bpm: number,
  pattern: BeatPattern,
  levels: TrackLevels,
): string {
  return `
    <section class="beats-panel" aria-label="Beats drum machine">
      <div class="beats-toolbar">
        <div class="metronome-tempo">
          <button class="note-btn" id="beatsBpmDownLarge" aria-label="Decrease tempo by ${LARGE_BPM_STEP}">&#10094;&#10094;</button>
          <button class="note-btn" id="beatsBpmDown" aria-label="Decrease tempo by ${SMALL_BPM_STEP}">&#10094;</button>
          <div class="metronome-bpm">
            <input class="metronome-bpm-value" id="beatsBpmValue" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" value="${bpm}" aria-label="Tempo in beats per minute">
            <span class="metronome-bpm-unit">BPM</span>
          </div>
          <button class="note-btn" id="beatsBpmUp" aria-label="Increase tempo by ${SMALL_BPM_STEP}">&#10095;</button>
          <button class="note-btn" id="beatsBpmUpLarge" aria-label="Increase tempo by ${LARGE_BPM_STEP}">&#10095;&#10095;</button>
        </div>
        <input class="metronome-slider beats-tempo-slider" id="beatsBpmSlider" type="range" min="${MIN_BPM}" max="${MAX_BPM}" step="1" value="${bpm}" aria-label="Tempo in beats per minute">
        <div class="beats-actions">
          <button class="note-detection-btn" id="beatsToggleBtn">Start</button>
          <span id="beatsReset"></span>
        </div>
      </div>
      <div class="beats-workspace" id="beatsGrid">
        ${beatMixerHtml(levels)}
        <div class="beats-grid-scroll">${beatGridHtml(pattern)}</div>
      </div>
      <p class="beats-hint">Tap cells to build a one-bar rhythm. The playhead follows sixteenth notes.</p>
    </section>
  `;
}
