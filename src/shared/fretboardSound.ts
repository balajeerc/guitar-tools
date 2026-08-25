import {
  STRING_BASE_PITCH,
  STRING_ORDER,
  STRING_Y_POSITIONS,
} from "./constants";
import { fretCenterPosition } from "./fretboardRenderer";
import { positionFromPoint, type FretboardPosition } from "./fretboardPosition";
import { getLayoutConfig } from "./layout";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "fretboard-sound-enabled";
const LOW_E_FREQUENCY = 82.4069;
const SOUND_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
  <path class="sound-wave" d="M15.5 8.5a5 5 0 0 1 0 7"></path>
  <path class="sound-wave" d="M19 5a10 10 0 0 1 0 14"></path>
  <line class="sound-muted" x1="16" y1="9" x2="22" y2="15"></line>
  <line class="sound-muted" x1="22" y1="9" x2="16" y2="15"></line>
</svg>`;

let enabled = true;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}

function frequencyAt(position: FretboardPosition): number {
  const semitones = STRING_BASE_PITCH[position.stringIdx] + position.fret;
  return LOW_E_FREQUENCY * 2 ** (semitones / 12);
}

/** Build a warm, naturally decaying string with the Karplus–Strong algorithm. */
function createPluckBuffer(ctx: AudioContext, frequency: number): AudioBuffer {
  const duration = 2.4;
  const frameCount = Math.ceil(ctx.sampleRate * duration);
  const period = Math.max(2, Math.round(ctx.sampleRate / frequency - 0.5));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  const string = new Float32Array(period);
  const noise = crypto.getRandomValues(new Uint32Array(period));

  // A smoothed noise impulse behaves more like a soft fingertip or pick than
  // full-band white noise, avoiding the sharp metallic transient.
  let previous = 0;
  for (let i = 0; i < period; i++) {
    const random = (noise[i] / 0xffffffff) * 2 - 1;
    string[i] = random * 0.35 + previous * 0.65;
    previous = string[i];
  }

  const cycles = frequency * duration;
  const decayPerCycle = Math.exp(Math.log(0.015) / cycles);
  const attackFrames = Math.ceil(ctx.sampleRate * 0.004);
  for (let i = 0; i < frameCount; i++) {
    const index = i % period;
    const nextIndex = (index + 1) % period;
    const value = (string[index] + string[nextIndex]) * 0.5 * decayPerCycle;
    string[index] = value;
    samples[i] = value * Math.min(1, i / attackFrames);
  }

  return buffer;
}

/** Play the modeled string through a subtle wooden-body tone shape. */
function pluck(position: FretboardPosition): void {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") void ctx.resume();

  const frequency = frequencyAt(position);
  const startedAt = ctx.currentTime;
  const source = ctx.createBufferSource();
  const warmth = ctx.createBiquadFilter();
  const body = ctx.createBiquadFilter();
  const soften = ctx.createBiquadFilter();
  const output = ctx.createGain();

  source.buffer = createPluckBuffer(ctx, frequency);
  warmth.type = "lowpass";
  warmth.frequency.value = Math.min(3800, 2400 + frequency * 1.5);
  warmth.Q.value = 0.55;
  body.type = "peaking";
  body.frequency.value = 190;
  body.Q.value = 0.9;
  body.gain.value = 4;
  soften.type = "highshelf";
  soften.frequency.value = 1400;
  soften.gain.value = -7;
  output.gain.setValueAtTime(0.58, startedAt);
  output.gain.exponentialRampToValueAtTime(0.0001, startedAt + 2.4);

  source.connect(warmth);
  warmth.connect(body);
  body.connect(soften);
  soften.connect(output);
  output.connect(ctx.destination);
  source.start(startedAt);
  source.stop(startedAt + 2.4);

  window.setTimeout(() => {
    source.disconnect();
    warmth.disconnect();
    body.disconnect();
    soften.disconnect();
    output.disconnect();
  }, 2500);
}

function showTap(board: HTMLElement, position: FretboardPosition): void {
  const config = getLayoutConfig();
  const visualIdx = STRING_ORDER.indexOf(position.stringIdx);
  const posIdx = config.isVertical ? 5 - visualIdx : visualIdx;
  const marker = document.createElement("span");
  marker.className = "fretboard-sound-tap";
  marker.style[config.fretAxis] =
    `${fretCenterPosition(position.fret, config)}px`;
  marker.style[config.stringAxis] = `${STRING_Y_POSITIONS[posIdx]}px`;
  board.appendChild(marker);
  marker.addEventListener("animationend", () => marker.remove(), { once: true });
}

function syncButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(".sound-toggle")) {
    button.classList.toggle("sound-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", `Fretboard sound ${enabled ? "on" : "off"}`);
    button.title = `Fretboard sound: ${enabled ? "on" : "off"}`;
  }
}

function createSoundToggleButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "sound-toggle";
  button.innerHTML = SOUND_ICON;
  button.addEventListener("click", () => {
    enabled = !enabled;
    savePersisted(STORAGE_KEY, enabled);
    syncButtons();
  });
  return button;
}

function handleFretboardTap(event: MouseEvent): void {
  if (!enabled) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const board = target.closest<HTMLElement>(".fretboard");
  if (!board) return;
  const position = positionFromPoint(event.clientX, event.clientY, board);
  if (!position) return;
  pluck(position);
  showTap(board, position);
}

export function initFretboardSound(): void {
  enabled = loadPersisted(STORAGE_KEY, true);
  document.querySelector(".nav-container")?.appendChild(createSoundToggleButton());
  document.getElementById("sidebarSoundToggle")?.appendChild(createSoundToggleButton());
  syncButtons();
  document.addEventListener("click", handleFretboardTap);
}
