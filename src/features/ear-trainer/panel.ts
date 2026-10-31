import { MELODY_TONES } from "../melodies/tone";
import { MAX_OCTAVE, MIN_OCTAVE } from "./theory";

function toneButtonsHtml(): string {
  return MELODY_TONES.map(
    ({ value, label }) =>
      `<button type="button" class="melodies-tone-btn" id="earTrainerTone${value}Btn" aria-pressed="false">${label}</button>`,
  ).join("");
}

export function earTrainerPanelHtml(): string {
  return `<section class="melodies-game ear-trainer" aria-labelledby="earTrainerHeading">
    <header class="melodies-hero">
      <p class="melodies-eyebrow">Scale degree ear training</p>
      <h1 id="earTrainerHeading">Name the scale degrees you hear</h1>
      <p class="melodies-intro">Listen to the phrase, then name each note as a scale degree of the key.</p>
    </header>

    <div class="melodies-card">
      <div class="melodies-round-header">
        <span class="melodies-round" id="earTrainerRoundLabel">Octave 2–3 · Key C · Asc + desc</span>
        <span class="melodies-timer" id="earTrainerRoundDetail">3 notes · 2 intervals</span>
      </div>

      <details class="ear-trainer-settings" id="earTrainerSettings">
        <summary class="ear-trainer-settings-summary">Settings</summary>
        <div class="ear-trainer-settings-content">
        <div class="ear-trainer-setting-row ear-trainer-range-row">
          <div class="ear-trainer-field">
            <span class="control-label">Octaves:</span>
            <span class="ear-trainer-octave-inputs">
              <input id="earTrainerOctaveStart" type="number" min="${MIN_OCTAVE}" max="${MAX_OCTAVE}" step="1"
                inputmode="numeric" value="2" aria-label="Lowest octave" />
              <span>to</span>
              <input id="earTrainerOctaveEnd" type="number" min="${MIN_OCTAVE}" max="${MAX_OCTAVE}" step="1"
                inputmode="numeric" value="3" aria-label="Highest octave" />
            </span>
          </div>
          <div class="control-group">
            <span class="control-label">Notes:</span>
            <div class="note-selector">
              <button class="note-btn" id="earTrainerNotesDown" aria-label="Fewer notes">&#10094;</button>
              <div class="note-display" id="earTrainerNotesDisplay">3</div>
              <button class="note-btn" id="earTrainerNotesUp" aria-label="More notes">&#10095;</button>
            </div>
          </div>
        </div>

        <div class="ear-trainer-setting-row">
          <label class="checkbox-label">
            <input type="checkbox" id="earTrainerPlayRootFirst" />
            <span>Play root first</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="earTrainerFixKey" />
            <span>Fix key</span>
          </label>
          <div class="ear-trainer-key" id="earTrainerKeyControl" hidden>
            <span class="control-label">Key:</span>
            <div class="note-selector">
              <button class="note-btn" id="earTrainerKeyPrev" aria-label="Previous key">&#10094;</button>
              <div class="note-display" id="earTrainerKeyDisplay">C</div>
              <button class="note-btn" id="earTrainerKeyNext" aria-label="Next key">&#10095;</button>
            </div>
          </div>
        </div>

        <div class="ear-trainer-setting-row">
          <div class="ear-trainer-field ear-trainer-direction-field" role="group" aria-labelledby="earTrainerDirectionLabel">
            <span class="control-label" id="earTrainerDirectionLabel">Direction:</span>
            <span class="ear-trainer-direction-options">
              <label class="checkbox-label">
                <input type="checkbox" id="earTrainerAscending" checked />
                <span>Ascending</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="earTrainerDescending" checked />
                <span>Descending</span>
              </label>
            </span>
          </div>
        </div>

        <div class="ear-trainer-setting-row ear-trainer-tone-row">
          <fieldset class="melodies-tone">
            <legend>Tone</legend>
            <div class="melodies-tone-options">${toneButtonsHtml()}</div>
          </fieldset>
          <span id="earTrainerReset"></span>
        </div>

        <p class="ear-trainer-settings-hint" id="earTrainerSettingsHint"></p>
        </div>
      </details>

      <div class="melodies-prompt" id="earTrainerPrompt">
        <span class="melodies-prompt-icon" aria-hidden="true">♪</span>
        <strong id="earTrainerStatus">Press play to listen</strong>
        <span id="earTrainerHint">Enter each note as a scale degree of the key.</span>
      </div>

      <div class="melodies-manual ear-trainer-manual">
        <label class="melodies-manual-label" for="earTrainerDegreeInput">
          Enter each note as a scale degree of the key (1–7)
        </label>
        <div class="melodies-interval-entry" id="earTrainerDegreeEntry">
          <div class="melodies-interval-boxes" id="earTrainerDegreeBoxes"></div>
          <input id="earTrainerDegreeInput" class="melodies-interval-input" type="text" inputmode="numeric"
            pattern="[1-7]*" autocomplete="off" aria-label="Note scale degrees" />
        </div>
        <p class="ear-trainer-input-hint">
          Example: 1, ♭3, 5. Tap the small button under a box to cycle ♭, ♮, ♯.
        </p>
      </div>

      <div class="melodies-actions">
        <button type="button" class="melodies-btn melodies-btn-secondary" id="earTrainerPlayBtn">▶ Play notes</button>
        <button type="button" class="melodies-btn melodies-btn-primary" id="earTrainerCheckBtn" disabled>
          Check answer
        </button>
      </div>

      <div class="melodies-result" id="earTrainerResult" hidden></div>
      <div class="melodies-footer-actions">
        <button type="button" class="melodies-link-btn" id="earTrainerRevealBtn">Reveal answer</button>
        <button type="button" class="melodies-link-btn" id="earTrainerNewBtn">New exercise</button>
      </div>
    </div>
  </section>`;
}
