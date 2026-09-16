export function renderTriadsPageTemplate(): string {
  return `
    <div class="controls-wrapper">
      <button class="controls-accordion-toggle" id="triadsAccordionToggle" type="button">
        <span class="controls-summary" id="triadsControlsSummary">C Major</span>
        <span class="controls-accordion-arrow">&#9662;</span>
      </button>
      <div class="controls" id="triadsControlsPanel">
        <div class="control-group">
          <span class="control-label">Root:</span>
          <div class="note-selector">
            <button class="note-btn" id="triadsPrevNote" type="button" aria-label="Previous root">&#10094;</button>
            <div class="note-display" id="triadsCurrentNote">C</div>
            <button class="note-btn" id="triadsNextNote" type="button" aria-label="Next root">&#10095;</button>
          </div>
        </div>
        <div class="control-group">
          <span class="control-label">Triad:</span>
          <div class="toggle-group">
            <button class="toggle-btn active" id="triadsMajorBtn" type="button">Major</button>
            <button class="toggle-btn" id="triadsMinorBtn" type="button">Minor</button>
          </div>
        </div>
        <div class="control-group">
          <span class="control-label">Orbit:</span>
          <div class="toggle-group" title="Show the surrounding R–♭3–3–5–♭7 blues cluster">
            <button class="toggle-btn active" id="triadsOrbitOffBtn" type="button" aria-pressed="true">Off</button>
            <button class="toggle-btn" id="triadsOrbitOnBtn" type="button" aria-pressed="false">On</button>
          </div>
        </div>
        <div class="control-group">
          <span class="control-label">View:</span>
          <div class="toggle-group">
            <button class="toggle-btn active" id="triadsStaticViewBtn" type="button" aria-pressed="true">Static</button>
            <button class="toggle-btn" id="triadsGroupingsViewBtn" type="button" aria-pressed="false">Groupings</button>
          </div>
        </div>
        <div class="control-group triads-grouping-controls" id="triadsProgressionControls" hidden>
          <span class="control-label">Progression:</span>
          <div class="triads-progression-editor" aria-label="Chord progression">
            ${[0, 1, 2, 3].map((index) => `
              <div class="triads-progression-slot">
                <button class="triads-degree-btn" type="button" data-progression-degree="${index}" aria-label="Change progression step ${index + 1}">I</button>
                <button class="triads-quality-btn" type="button" data-progression-quality="${index}" aria-label="Make progression step ${index + 1} minor">Major</button>
              </div>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="triads-step-status" id="triadsStepStatus" hidden>
      <span class="triads-active-chord" id="triadsActiveChord" aria-live="polite"></span>
      <div class="triads-step-indicator" aria-label="Progression playback position">
        ${[0, 1, 2, 3].map((index) => `
          <button class="triads-step-dash" type="button" data-triad-step="${index}" aria-label="Pause on progression step ${index + 1}"></button>`).join("")}
      </div>
    </div>
    <div class="triad-boards" id="triadBoards"></div>
  `;
}
