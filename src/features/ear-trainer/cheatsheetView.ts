import { type CheatsheetInterval } from './cheatsheetCatalog';
import './cheatsheet.css';

function intervalRow(interval: CheatsheetInterval): string {
  const { name, semitones, symbol, degree } = interval;
  return `<tr data-interval="${semitones}">
    <td class="cheatsheet-steps"><strong>${semitones}</strong><span>st</span></td>
    <th scope="row">${name}<small>${symbol} <span aria-hidden="true">·</span> 1 → ${degree}</small></th>
    <td class="cheatsheet-reference">
      <div class="cheatsheet-song" aria-live="polite" aria-atomic="true">
        <strong data-song-title></strong><span data-song-cue></span>
      </div>
      <div class="cheatsheet-pagination" role="group" aria-label="${name} song references">
        <button type="button" data-reference-step="-1" aria-label="Previous ${name} song">‹</button>
        <span data-song-count></span>
        <button type="button" data-reference-step="1" aria-label="Next ${name} song">›</button>
      </div>
    </td>
    <td class="cheatsheet-hear"><button type="button" class="cheatsheet-play" data-play-interval
      aria-label="Play ${name}: root then ${degree}" aria-pressed="false"><span aria-hidden="true">▶</span></button></td>
  </tr>`;
}

export function cheatsheetHtml(intervals: readonly CheatsheetInterval[]): string {
  return `<header class="cheatsheet-header">
      <div><p class="melodies-eyebrow">12 intervals · one octave</p>
        <h2 id="cheatsheetHeading">Hear the gap.</h2></div>
      <button type="button" class="cheatsheet-close" aria-label="Close cheatsheet" autofocus>×</button>
    </header>
    <div class="cheatsheet-body">
      <p class="cheatsheet-intro" id="cheatsheetDescription">Connect each interval to a tune you know. Hum the jump, then press play to check your ear.</p>
      <div class="cheatsheet-guide">
        <span class="cheatsheet-guide-icon" aria-hidden="true">♪</span>
        <p><strong>Root, then the note above.</strong> Every preview plays C4 followed by the ascending interval, using your selected tone. The song is a memory cue; you’ll hear just the two notes.</p>
      </div>
      <p class="cheatsheet-browse-hint">Use each row’s arrows to browse 5 song references. <span>st = semitones · 1 = root</span></p>
      <table class="cheatsheet-table">
        <caption>Ascending intervals from C4 with scale degrees and song references</caption>
        <thead><tr><th scope="col">Steps</th><th scope="col">Interval / degree</th><th scope="col">Reference tune · exact jump</th><th scope="col">Hear</th></tr></thead>
        <tbody>${intervals.map(intervalRow).join('')}</tbody>
      </table>
      <p class="cheatsheet-status" role="status" aria-live="polite"></p>
      <p class="cheatsheet-source">More interval references: <a href="https://www.earmaster.com/products/free-tools/interval-song-chart-generator.html" target="_blank" rel="noopener noreferrer">EarMaster’s song chart ↗</a></p>
    </div>`;
}
