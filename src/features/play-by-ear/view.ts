import { getNoteName } from "../../shared/constants";
import type { DetectedNote } from "../note-detection/noteMapper";
import { setDisabled, setText } from "../melodies/ui";
import type { EarTrainingSong } from "./catalog";
import type { SimplifiedPlaybackSource } from "./simplifiedPlayer";

export interface PlayByEarButtonState {
  videoLooping: boolean;
  playerLoading: boolean;
  hasVideoPlayer: boolean;
  playbackRates: readonly number[];
  playbackRate: number;
  simplifiedPlayback: SimplifiedPlaybackSource;
  listening: boolean;
  hasListened: boolean;
  finished: boolean;
  hasHeardNotes: boolean;
  manualInputLength: number;
  expectedNotes: number;
  sectionIndex: number;
  sectionCount: number;
}

function updateLoopButton(state: PlayByEarButtonState): void {
  const loopButton = document.getElementById("playEarLoopBtn");
  const loopLabel = state.videoLooping ? "Restart loop" : "Play loop";
  setText("playEarLoopBtn", state.videoLooping ? "↻" : "▶");
  loopButton?.setAttribute("aria-label", loopLabel);
  loopButton?.setAttribute("title", loopLabel);
  setDisabled("playEarLoopBtn", state.playerLoading);
}

function updatePlaybackRateButtons(state: PlayByEarButtonState): void {
  setText("playEarPlaybackRate", `${state.playbackRate}×`);
  const rateIndex = state.playbackRates.indexOf(state.playbackRate);
  setDisabled("playEarSlowerBtn", !state.hasVideoPlayer || state.playerLoading || rateIndex <= 0);
  setDisabled(
    "playEarFasterBtn",
    !state.hasVideoPlayer || state.playerLoading || rateIndex < 0 || rateIndex >= state.playbackRates.length - 1,
  );
}

function updateSimplifiedPlaybackButtons(state: PlayByEarButtonState): void {
  const simplifiedPlaying = state.simplifiedPlayback !== null;
  setText("playEarSimplifiedBtn", state.simplifiedPlayback === "expected" ? "♪ Playing…" : "Play simplified version");
  setText("playEarPlayHeardBtn", state.simplifiedPlayback === "heard" ? "♪ Playing…" : "Play heard notes");
  setDisabled("playEarSimplifiedBtn", simplifiedPlaying);
  setDisabled("playEarPlayHeardBtn", state.finished || !state.hasHeardNotes || simplifiedPlaying);
}

function updateGuessButtons(state: PlayByEarButtonState): void {
  setText("playEarGuessBtn", state.listening ? "Stop playing" : "Start playing");
  setDisabled("playEarGuessBtn", state.finished);
  setDisabled("playEarResetNotesBtn", state.finished || !state.hasHeardNotes);
  setDisabled("playEarAutoClearNotes", state.finished);
  setDisabled("playEarCheckBtn", state.finished || state.manualInputLength !== state.expectedNotes);
  setDisabled("playEarMicMethodBtn", state.finished);
  setDisabled("playEarManualMethodBtn", state.finished);
  setDisabled("playEarRevealBtn", state.finished);
  setDisabled("playEarManualRevealBtn", state.finished);
}

function updateNavigationButtons(state: PlayByEarButtonState): void {
  setDisabled("playEarPreviousSectionBtn", state.sectionIndex === 0);
  setDisabled("playEarNextSectionBtn", state.sectionIndex === state.sectionCount - 1);
}

export function updatePlayByEarButtons(state: PlayByEarButtonState): void {
  updateLoopButton(state);
  updatePlaybackRateButtons(state);
  updateSimplifiedPlaybackButtons(state);
  updateGuessButtons(state);
  updateNavigationButtons(state);
  const field = document.getElementById("playEarIntervalInput") as HTMLInputElement | null;
  if (field) field.disabled = !state.hasListened || state.finished;
}

export function renderPlayByEarProgress(value: number, total: number, label: string): void {
  const progress = total === 0 ? 0 : (value / total) * 100;
  const bar = document.getElementById("playEarProgressBar");
  if (bar) bar.style.width = `${progress}%`;
  setText("playEarProgressText", `${value} of ${total} ${label}`);
}

export function renderDetectedNote(note: DetectedNote, matchedNotes: number): void {
  const octave = Math.floor(note.midiNote / 12) - 1;
  setText("playEarDetectedNote", `${getNoteName(note.noteIndex, "sharp")}${octave}`);
  setText("playEarDetectedInterval", `${matchedNotes} notes matched so far`);
}

export function renderPlayByEarSections(
  song: EarTrainingSong,
  sectionIndex: number,
  completedSectionKeys: ReadonlySet<string>,
): void {
  const container = document.getElementById("playEarSectionTabs");
  if (!container) return;
  container.innerHTML = song.sections.map((section, index) => {
    const active = index === sectionIndex;
    const complete = completedSectionKeys.has(`${song.id}/${section.id}`);
    return `<button type="button" class="play-ear-section-btn${active ? " active" : ""}" data-section-index="${index}" aria-pressed="${active}"><span>${complete ? "✓ " : ""}${section.label}</span><small>${section.notes.length} notes · ${section.difficulty}</small></button>`;
  }).join("");
  setText("playEarSectionCounter", `${sectionIndex + 1} of ${song.sections.length} · ${song.sections[sectionIndex].difficulty}`);
}

export function renderPlayByEarSong(
  song: EarTrainingSong,
  songs: readonly EarTrainingSong[],
  sectionIndex: number,
  completedSectionKeys: ReadonlySet<string>,
): void {
  const select = document.getElementById("playEarSongSelect") as HTMLSelectElement | null;
  if (select) {
    select.replaceChildren(...songs.map(({ title, id }) => new Option(title, id)));
    select.value = song.id;
  }
  setText("playEarSongTitle", song.title);
  setText("playEarPerformance", song.performance);
  setText("playEarSongKey", song.key);
  const link = document.getElementById("playEarYoutubeLink") as HTMLAnchorElement | null;
  if (link) link.href = `https://www.youtube.com/watch?v=${song.youtubeVideoId}`;
  renderPlayByEarSections(song, sectionIndex, completedSectionKeys);
}
