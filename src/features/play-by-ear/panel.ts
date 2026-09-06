import { audioInputPanelHtml } from "../../shared/audioInput";

export function playByEarPanelHtml(): string {
  return `<section class="play-ear-game" aria-labelledby="playEarHeading">
    <header class="melodies-hero">
      <p class="melodies-eyebrow">Real songs · by ear</p>
      <h1 id="playEarHeading">Hear the phrase. Find it on your guitar.</h1>
      <p class="melodies-intro">Loop a short section from a curated performance, then reproduce its notes in any key or enter the intervals.</p>
    </header>

    <div class="play-ear-layout">
      <section class="play-ear-media-card" aria-labelledby="playEarSongTitle">
        <label class="play-ear-song-field" for="playEarSongSelect">
          <span>Song</span><select id="playEarSongSelect"></select>
        </label>
        <div class="play-ear-song-heading">
          <div><h2 id="playEarSongTitle"></h2><p id="playEarPerformance"></p></div>
          <span id="playEarSongKey"></span>
        </div>
        <div class="play-ear-video-shell">
          <div id="playEarYoutubePlayer" class="play-ear-video-placeholder">
            <span aria-hidden="true">▶</span><p>The video loads when you play the first loop.</p>
          </div>
        </div>
        <p class="play-ear-video-status" id="playEarVideoStatus" aria-live="polite">Choose a section, then play the loop.</p>
        <div class="play-ear-loop-actions">
          <button type="button" class="melodies-btn melodies-btn-secondary" id="playEarLoopBtn">▶ Play loop</button>
          <a id="playEarYoutubeLink" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>
        </div>
      </section>

      <section class="melodies-card play-ear-guess-card">
        <div class="play-ear-section-heading">
          <span>Section</span><strong id="playEarSectionCounter"></strong>
        </div>
        <div class="play-ear-section-tabs" id="playEarSectionTabs"></div>

        <div class="melodies-prompt">
          <span class="melodies-prompt-icon" aria-hidden="true">♪</span>
          <strong id="playEarStatus">Listen to the section first</strong>
          <span id="playEarHint">Replay it as many times as you need.</span>
        </div>

        <label class="play-ear-pause-setting">
          <input type="checkbox" id="playEarPauseWhileGuessing" checked />
          <span><strong>Pause video while guessing</strong><small>Turn this off when using an audio interface or headphones.</small></span>
        </label>

        <fieldset class="melodies-method">
          <legend>How do you want to guess?</legend>
          <button type="button" class="melodies-method-btn active" id="playEarMicMethodBtn" aria-pressed="true">
            <strong>Play it</strong><span>Use selected audio input</span>
          </button>
          <button type="button" class="melodies-method-btn" id="playEarManualMethodBtn" aria-pressed="false">
            <strong>Enter intervals</strong><span>No listening required</span>
          </button>
        </fieldset>

        <div class="melodies-progress" aria-label="Section progress">
          <div class="melodies-progress-track"><span id="playEarProgressBar"></span></div>
          <span id="playEarProgressText">0 of 0 notes</span>
        </div>

        <div id="playEarMicrophonePanel">
          <div class="melodies-detected" aria-live="polite">
            <span class="melodies-detected-label">Heard</span>
            <strong id="playEarDetectedNote">—</strong>
            <span id="playEarDetectedInterval">Waiting for your guitar</span>
          </div>
          <div class="melodies-actions">
            <button type="button" class="melodies-btn melodies-btn-primary" id="playEarGuessBtn" disabled>Start playing</button>
            <button type="button" class="melodies-btn melodies-btn-secondary" id="playEarResetNotesBtn" disabled>Reset notes</button>
          </div>
          <p class="play-ear-detection-hint">For reliable recognition, play clean single notes and let each one sound briefly.</p>
        </div>

        <div class="melodies-manual" id="playEarManualPanel" hidden>
          <label class="melodies-manual-label" for="playEarIntervalInput">Treat the first heard note as 1, or use degrees from the song key.</label>
          <div class="melodies-interval-entry" id="playEarIntervalEntry">
            <div class="melodies-interval-boxes" id="playEarIntervalBoxes"></div>
            <input id="playEarIntervalInput" class="melodies-interval-input" type="text" inputmode="numeric"
              pattern="[1-7]*" autocomplete="off" aria-label="Section scale degrees" />
          </div>
          <button type="button" class="melodies-btn melodies-btn-primary melodies-check-btn" id="playEarCheckBtn" disabled>Check intervals</button>
        </div>

        <div class="melodies-result" id="playEarResult" hidden></div>
        <div class="melodies-footer-actions">
          <button type="button" class="melodies-link-btn" id="playEarRevealBtn">Reveal answer</button>
          <button type="button" class="melodies-link-btn" id="playEarPreviousSectionBtn">← Previous section</button>
          <button type="button" class="melodies-link-btn" id="playEarNextSectionBtn">Next section →</button>
        </div>
      </section>
    </div>

    ${audioInputPanelHtml(
      "playEar",
      "To play along while the video loops, connect your guitar through an audio interface. Otherwise, pause the video while guessing.",
    )}
    <p class="melodies-mic-note">Only the selected audio input is analyzed. YouTube audio is never transcribed.</p>
  </section>`;
}
