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
      </div>
    </div>
    <div class="triad-boards" id="triadBoards"></div>
  `;
}
