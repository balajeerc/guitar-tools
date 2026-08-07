// Renders the progression panel below the wheel: degree toggles plus the chords
// they resolve to in the selected key.

import { getDiatonicChords, type Chord, type KeyMode } from "./theory";

function degreeButtons(
  chords: readonly Chord[],
  degrees: readonly number[],
): string {
  return chords
    .map((chord, degree) => {
      const active = degrees.includes(degree) ? " active" : "";
      return `<button type="button" class="cof-degree-btn${active}" data-degree="${degree}">${chord.numeral}</button>`;
    })
    .join("");
}

function chordCard(chord: Chord): string {
  return `<div class="cof-chord"><span class="cof-chord-numeral">${chord.numeral}</span><span class="cof-chord-name">${chord.name}</span></div>`;
}

function progression(chords: readonly Chord[], degrees: readonly number[]): string {
  if (degrees.length === 0) {
    return `<p class="cof-progression-empty">Pick a degree to start a progression.</p>`;
  }
  return [...degrees]
    .sort((a, b) => a - b)
    .map((degree) => chordCard(chords[degree]))
    .join(`<span class="cof-chord-sep">–</span>`);
}

export function renderPanel(
  tonic: string,
  mode: KeyMode,
  degrees: readonly number[],
): string {
  const chords = getDiatonicChords(tonic, mode);
  const modeName = mode === "major" ? "Major" : "Minor";

  return `
    <div class="cof-panel-header">
      <span class="cof-panel-label">Progression</span>
      <span class="cof-key-name">${tonic} ${modeName}</span>
    </div>
    <span class="cof-panel-label">Degrees</span>
    <div class="cof-degrees">${degreeButtons(chords, degrees)}</div>
    <div class="cof-progression">${progression(chords, degrees)}</div>
    <div class="cof-reset-row"></div>
  `;
}
