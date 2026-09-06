import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "audio-input-device";
export const AUDIO_INPUT_CHANGED_EVENT = "guitar-tools:audio-input-changed";
const AUDIO_INPUTS_AVAILABLE_EVENT = "guitar-tools:audio-inputs-available";

const DEFAULT_NOTICE =
  "Note detection works best when your guitar is connected directly through an audio interface. Built-in microphones may be less accurate.";

export function getSelectedAudioInputId(): string | null {
  return loadPersisted<string | null>(STORAGE_KEY, null);
}

export function clearSelectedAudioInput(): void {
  savePersisted(STORAGE_KEY, null);
}

function setSelectedAudioInputId(deviceId: string | null): void {
  savePersisted(STORAGE_KEY, deviceId);
  window.dispatchEvent(new CustomEvent(AUDIO_INPUT_CHANGED_EVENT));
}

export function notifyAudioInputsAvailable(): void {
  window.dispatchEvent(new CustomEvent(AUDIO_INPUTS_AVAILABLE_EVENT));
}

export function audioInputPanelHtml(scope: string, notice = DEFAULT_NOTICE): string {
  return `<aside class="audio-input-panel">
    <div class="audio-input-notice">
      <strong>Audio interface recommended</strong>
      <span>${notice}</span>
    </div>
    <label class="audio-input-field" for="${scope}AudioInput">
      <span>Audio input</span>
      <select id="${scope}AudioInput" data-audio-input-select>
        <option value="">System default</option>
      </select>
    </label>
    <small data-audio-input-help>Allow audio access once to see device names.</small>
  </aside>`;
}

export function createAudioInputPanel(scope: string, notice = DEFAULT_NOTICE): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = audioInputPanelHtml(scope, notice).trim();
  const panel = template.content.firstElementChild;
  if (!(panel instanceof HTMLElement)) throw new Error("Audio input panel could not be created");
  return panel;
}

async function getAudioInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(({ kind, deviceId }) => kind === "audioinput" && deviceId !== "default");
}

function renderSelector(select: HTMLSelectElement, devices: readonly MediaDeviceInfo[]): void {
  const selectedId = getSelectedAudioInputId() ?? "";
  select.replaceChildren(new Option("System default", ""));
  for (const [index, device] of devices.entries()) {
    select.add(new Option(device.label || `Audio input ${index + 1}`, device.deviceId));
  }
  select.value = devices.some(({ deviceId }) => deviceId === selectedId) ? selectedId : "";
}

async function refreshAudioInputControls(): Promise<void> {
  const selects = document.querySelectorAll<HTMLSelectElement>("[data-audio-input-select]");
  if (selects.length === 0) return;
  try {
    const devices = await getAudioInputs();
    for (const select of selects) renderSelector(select, devices);
    const hasLabels = devices.some(({ label }) => label.length > 0);
    for (const help of document.querySelectorAll<HTMLElement>("[data-audio-input-help]")) {
      help.hidden = hasLabels;
    }
  } catch {
    for (const select of selects) select.disabled = true;
  }
}

function handleSelection(event: Event): void {
  const select = event.target as HTMLSelectElement;
  setSelectedAudioInputId(select.value || null);
  for (const peer of document.querySelectorAll<HTMLSelectElement>("[data-audio-input-select]")) {
    peer.value = select.value;
  }
}

export function initAudioInputControls(): void {
  for (const select of document.querySelectorAll<HTMLSelectElement>("[data-audio-input-select]")) {
    select.addEventListener("change", handleSelection);
  }
  window.addEventListener(AUDIO_INPUTS_AVAILABLE_EVENT, () => void refreshAudioInputControls());
  navigator.mediaDevices?.addEventListener("devicechange", () => void refreshAudioInputControls());
  void refreshAudioInputControls();
}
