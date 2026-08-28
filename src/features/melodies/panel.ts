export function melodiesPanelHtml(): string {
  return `<section class="melodies-game" aria-labelledby="melodiesHeading">
    <header class="melodies-hero">
      <p class="melodies-eyebrow">Play by ear</p>
      <h1 id="melodiesHeading">Can you play the melody back?</h1>
      <p class="melodies-intro">Listen to a short phrase, then reproduce it on your guitar in any key or octave.</p>
    </header>

    <div class="melodies-card">
      <div class="melodies-round-header">
        <span class="melodies-round" id="melodiesRoundLabel">Mystery melody</span>
        <time class="melodies-timer" id="melodiesTimer">0:00.0</time>
      </div>

      <div class="melodies-prompt" id="melodiesPrompt">
        <span class="melodies-prompt-icon" aria-hidden="true">♪</span>
        <strong id="melodiesStatus">Listen first, then play it back</strong>
        <span id="melodiesHint">The first note can be anywhere that feels comfortable.</span>
      </div>

      <fieldset class="melodies-difficulty">
        <legend>Difficulty</legend>
        <div class="melodies-difficulty-options">
          <button type="button" class="melodies-difficulty-btn active" id="melodiesEasyBtn" aria-pressed="true">
            Easy
          </button>
          <button type="button" class="melodies-difficulty-btn" id="melodiesMediumBtn" aria-pressed="false">
            Medium
          </button>
          <button type="button" class="melodies-difficulty-btn" id="melodiesHardBtn" aria-pressed="false">
            Hard
          </button>
        </div>
        <p id="melodiesDifficultyHint">Famous, memorable tunes.</p>
      </fieldset>

      <div class="melodies-root-row">
        <button type="button" class="melodies-root-toggle" id="melodiesRootToggle" aria-pressed="false">
          Show root
        </button>
        <output class="melodies-root-value" id="melodiesRootValue" aria-live="polite" hidden>
          Target root <strong id="melodiesRootNote">C</strong>
          <span id="melodiesKeyName">C major</span>
        </output>
      </div>

      <fieldset class="melodies-method">
        <legend>How do you want to guess?</legend>
        <button type="button" class="melodies-method-btn active" id="melodiesMicMethodBtn" aria-pressed="true">
          <strong>Play it</strong><span>Use microphone</span>
        </button>
        <button type="button" class="melodies-method-btn" id="melodiesManualMethodBtn" aria-pressed="false">
          <strong>Enter intervals</strong><span>No microphone</span>
        </button>
      </fieldset>

      <div class="melodies-progress" aria-label="Melody progress">
        <div class="melodies-progress-track">
          <span id="melodiesProgressBar"></span>
        </div>
        <span id="melodiesProgressText">0 of 0 notes</span>
      </div>

      <div id="melodiesMicrophonePanel">
        <div class="melodies-detected" aria-live="polite">
          <span class="melodies-detected-label">Heard</span>
          <strong id="melodiesDetectedNote">—</strong>
          <span id="melodiesDetectedInterval">Waiting for your guitar</span>
        </div>
      </div>

      <div class="melodies-manual" id="melodiesManualPanel" hidden>
        <label class="melodies-manual-label" for="melodiesIntervalInput">
          Use the original key, or treat the first heard note as 1
        </label>
        <div class="melodies-interval-entry" id="melodiesIntervalEntry">
          <div class="melodies-interval-boxes" id="melodiesIntervalBoxes"></div>
          <input id="melodiesIntervalInput" class="melodies-interval-input" type="text" inputmode="numeric"
            pattern="[1-7]*" autocomplete="off" aria-label="Melody scale degrees" />
        </div>
        <label class="melodies-key-field" for="melodiesKeyInput">
          <span>Key guess <small>optional</small></span>
          <input id="melodiesKeyInput" type="text" autocomplete="off" autocapitalize="words"
            placeholder="e.g. C major" />
        </label>
        <button type="button" class="melodies-btn melodies-btn-primary melodies-check-btn" id="melodiesCheckBtn">
          Check intervals
        </button>
      </div>

      <div class="melodies-actions">
        <button class="melodies-btn melodies-btn-secondary" id="melodiesPlayBtn">▶ Hear melody</button>
        <button class="melodies-btn melodies-btn-primary" id="melodiesGuessBtn">Start guessing</button>
      </div>

      <div class="melodies-result" id="melodiesResult" hidden></div>
      <div class="melodies-footer-actions">
        <button class="melodies-link-btn" id="melodiesRevealBtn">Reveal answer</button>
        <button class="melodies-link-btn" id="melodiesPreviousBtn" disabled>← Previous tune</button>
        <button class="melodies-link-btn" id="melodiesNewBtn">New melody</button>
        <button class="melodies-link-btn" id="melodiesNextBtn" disabled>Next tune →</button>
      </div>
    </div>

    <p class="melodies-mic-note">Use a clean, single-note sound. Microphone audio stays on this device.</p>
  </section>`;
}
