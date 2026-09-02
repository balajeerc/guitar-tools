import { loadPersisted, savePersisted } from "../../shared/persist";
import { isMelodyTone, MELODY_TONES, type MelodyTone } from "./tone";
import { setPressed } from "./ui";

const STORAGE_KEY = "melodies-tone";

export function toneControlHtml(): string {
  const buttons = MELODY_TONES.map(
    ({ value, label }) =>
      `<button type="button" class="melodies-tone-btn" id="melodiesTone${value}Btn" aria-pressed="false">${label}</button>`,
  ).join("");
  return `<fieldset class="melodies-tone"><legend>Tone</legend><div class="melodies-tone-options">${buttons}</div></fieldset>`;
}

export function loadMelodyTone(): MelodyTone {
  const stored = loadPersisted<unknown>(STORAGE_KEY, "pluck");
  return isMelodyTone(stored) ? stored : "pluck";
}

function renderTone(tone: MelodyTone): void {
  for (const option of MELODY_TONES) {
    setPressed(`melodiesTone${option.value}Btn`, tone === option.value);
  }
}

export function setupToneControl(initialTone: MelodyTone, onChange: (tone: MelodyTone) => void): void {
  renderTone(initialTone);
  for (const option of MELODY_TONES) {
    document.getElementById(`melodiesTone${option.value}Btn`)?.addEventListener("click", () => {
      savePersisted(STORAGE_KEY, option.value);
      renderTone(option.value);
      onChange(option.value);
    });
  }
}
