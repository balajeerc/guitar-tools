import { getNoteName } from "../../shared/constants";
import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { loadPersisted, savePersisted } from "../../shared/persist";
import type { DetectedNote } from "../note-detection/noteMapper";
import { createNoteGate, type NoteGate } from "../melodies/noteGate";
import {
  degreesFromFirstNote,
  evaluateDegreeGuess,
  sanitizeDegreeInput,
} from "../melodies/manualGuess";
import type { MelodyMatcher } from "../melodies/matcher";
import {
  accidentalPrefix,
  degreeBoxesHtml,
  formatDegree,
  intervalAnswerHtml,
  nextDegreeAccidental,
  setDisabled,
  setHidden,
  setPressed,
  setText,
} from "../melodies/ui";
import { EAR_TRAINING_SONGS, type EarTrainingSection, type EarTrainingSong } from "./catalog";
import { playByEarPanelHtml } from "./panel";
import {
  createYouTubeSectionPlayer,
  type YouTubeSection,
  type YouTubeSectionPlayer,
} from "./youtubePlayer";
import { createSlidingMelodyMatcher } from "./slidingMatcher";

type GuessMethod = "microphone" | "manual";
type GameStatus = "ready" | "guessing" | "complete" | "revealed";

interface GameState {
  songIndex: number;
  sectionIndex: number;
  status: GameStatus;
  method: GuessMethod;
  hasListened: boolean;
  videoLooping: boolean;
  playerLoading: boolean;
  matcher: MelodyMatcher;
  gate: NoteGate;
  matchedNotes: number;
  manualInput: readonly string[];
  manualJudgement: readonly boolean[] | null;
}

const METHOD_STORAGE_KEY = "play-by-ear-guess-method";
const PAUSE_STORAGE_KEY = "play-by-ear-pause-video";
const COMPLETED_STORAGE_KEY = "play-by-ear-completed-sections";
const PLAY_BY_EAR_STABLE_NOTE_MS = 50;

let state: GameState;
let listener: AudioListenerHandle;
let player: YouTubeSectionPlayer | null = null;
let pauseWhileGuessing = true;
let completedSections = new Set<string>();

function currentSong(): EarTrainingSong {
  return EAR_TRAINING_SONGS[state.songIndex];
}

function currentSection(): EarTrainingSection {
  return currentSong().sections[state.sectionIndex];
}

function sectionKey(song = currentSong(), section = currentSection()): string {
  return `${song.id}/${section.id}`;
}

function createState(songIndex: number, sectionIndex: number, method: GuessMethod): GameState {
  const section = EAR_TRAINING_SONGS[songIndex].sections[sectionIndex];
  return {
    songIndex,
    sectionIndex,
    status: "ready",
    method,
    hasListened: false,
    videoLooping: false,
    playerLoading: false,
    matcher: createSlidingMelodyMatcher(section.notes),
    gate: createNoteGate({ stableNoteMs: PLAY_BY_EAR_STABLE_NOTE_MS }),
    matchedNotes: 0,
    manualInput: [],
    manualJudgement: null,
  };
}

function youtubeSection(section = currentSection()): YouTubeSection {
  return {
    videoId: currentSong().youtubeVideoId,
    startSeconds: section.startSeconds,
    endSeconds: section.endSeconds,
  };
}

function renderProgress(value = state.method === "manual" ? state.manualInput.length : state.matchedNotes): void {
  const total = currentSection().notes.length;
  const progress = total === 0 ? 0 : (value / total) * 100;
  const bar = document.getElementById("playEarProgressBar");
  if (bar) bar.style.width = `${progress}%`;
  setText("playEarProgressText", `${value} of ${total} ${state.method === "manual" ? "entered" : "notes"}`);
}

function renderManualBoxes(): void {
  const container = document.getElementById("playEarIntervalBoxes");
  if (!container) return;
  container.innerHTML = degreeBoxesHtml({
    expectedLength: currentSection().degrees.length,
    values: state.manualInput,
    judgement: state.manualJudgement,
    disabled: state.status === "complete" || state.status === "revealed",
    idPrefix: "play-ear",
  });
}

function updateButtons(): void {
  const finished = state.status === "complete" || state.status === "revealed";
  setText("playEarLoopBtn", state.videoLooping ? "Pause loop" : "▶ Play loop");
  setText("playEarGuessBtn", listener.isListening() ? "Stop playing" : "Start playing");
  setDisabled("playEarLoopBtn", state.playerLoading);
  setDisabled("playEarGuessBtn", !state.hasListened || finished);
  setDisabled("playEarResetNotesBtn", finished || state.matchedNotes === 0);
  setDisabled("playEarCheckBtn", finished || state.manualInput.length !== currentSection().notes.length);
  setDisabled("playEarMicMethodBtn", finished);
  setDisabled("playEarManualMethodBtn", finished);
  setDisabled("playEarRevealBtn", finished);
  setDisabled("playEarPreviousSectionBtn", state.sectionIndex === 0);
  setDisabled("playEarNextSectionBtn", state.sectionIndex === currentSong().sections.length - 1);
  const field = document.getElementById("playEarIntervalInput") as HTMLInputElement | null;
  if (field) field.disabled = !state.hasListened || finished;
}

function renderMethod(): void {
  const manual = state.method === "manual";
  setPressed("playEarMicMethodBtn", !manual);
  setPressed("playEarManualMethodBtn", manual);
  setHidden("playEarMicrophonePanel", manual);
  setHidden("playEarManualPanel", !manual);
  if (manual) renderManualBoxes();
  renderProgress();
  updateButtons();
}

function renderSections(): void {
  const sections = currentSong().sections;
  const container = document.getElementById("playEarSectionTabs");
  if (!container) return;
  container.innerHTML = sections.map((section, index) => {
    const active = index === state.sectionIndex;
    const complete = completedSections.has(sectionKey(currentSong(), section));
    return `<button type="button" class="play-ear-section-btn${active ? " active" : ""}" data-section-index="${index}" aria-pressed="${active}"><span>${complete ? "✓ " : ""}${section.label}</span><small>${section.notes.length} notes · ${section.difficulty}</small></button>`;
  }).join("");
  const difficulty = currentSection().difficulty;
  setText("playEarSectionCounter", `${state.sectionIndex + 1} of ${sections.length} · ${difficulty}`);
}

function renderSong(): void {
  const song = currentSong();
  const select = document.getElementById("playEarSongSelect") as HTMLSelectElement | null;
  if (select) {
    select.replaceChildren(...EAR_TRAINING_SONGS.map(({ title, id }) => new Option(title, id)));
    select.value = song.id;
  }
  setText("playEarSongTitle", song.title);
  setText("playEarPerformance", song.performance);
  setText("playEarSongKey", song.key);
  const link = document.getElementById("playEarYoutubeLink") as HTMLAnchorElement | null;
  if (link) link.href = `https://www.youtube.com/watch?v=${song.youtubeVideoId}`;
  renderSections();
}

function resetRoundUi(): void {
  setText("playEarStatus", "Listen to the section first");
  setText("playEarHint", "Replay it as many times as you need.");
  setText("playEarDetectedNote", "—");
  setText("playEarDetectedInterval", "Waiting for your guitar");
  const input = document.getElementById("playEarIntervalInput") as HTMLInputElement | null;
  if (input) {
    input.value = "";
    input.maxLength = currentSection().notes.length;
  }
  setHidden("playEarResult", true);
  renderSections();
  renderMethod();
}

function stopInput(): void {
  if (listener.isListening()) listener.stop();
  state.gate.reset();
}

function pauseVideo(): void {
  state.videoLooping = false;
  player?.pause();
  updateButtons();
}

function selectSection(index: number): void {
  if (index < 0 || index >= currentSong().sections.length || index === state.sectionIndex) return;
  stopInput();
  pauseVideo();
  state = createState(state.songIndex, index, state.method);
  player?.cue(youtubeSection());
  resetRoundUi();
}

function selectSong(index: number): void {
  if (index < 0 || index >= EAR_TRAINING_SONGS.length || index === state.songIndex) return;
  stopInput();
  pauseVideo();
  state = createState(index, 0, state.method);
  player?.cue(youtubeSection());
  renderSong();
  resetRoundUi();
}

async function ensurePlayer(): Promise<YouTubeSectionPlayer> {
  if (player) return player;
  state.playerLoading = true;
  setText("playEarVideoStatus", "Loading YouTube player…");
  updateButtons();
  try {
    player = await createYouTubeSectionPlayer("playEarYoutubePlayer", youtubeSection(), {
      onPlaying() {
        state.videoLooping = true;
        setText("playEarVideoStatus", `Looping ${currentSection().label}`);
        updateButtons();
      },
      onPaused() {
        state.videoLooping = false;
        setText("playEarVideoStatus", "Loop paused");
        updateButtons();
      },
      onError(message) {
        state.videoLooping = false;
        setText("playEarVideoStatus", message);
        updateButtons();
      },
    });
    return player;
  } finally {
    state.playerLoading = false;
    updateButtons();
  }
}

async function toggleLoop(): Promise<void> {
  if (state.videoLooping) {
    pauseVideo();
    return;
  }
  try {
    const videoPlayer = await ensurePlayer();
    state.hasListened = true;
    videoPlayer.playLoop(youtubeSection());
    setText("playEarStatus", "Listen for the shape of the phrase");
    setText("playEarHint", "When ready, play it back or enter the intervals.");
  } catch {
    setText("playEarVideoStatus", "YouTube could not be loaded. Check your connection and try again.");
  }
  updateButtons();
}

function prepareGuess(): void {
  if (pauseWhileGuessing && state.videoLooping) pauseVideo();
  state.status = "guessing";
}

function completeRound(accuracy: number): void {
  state.status = "complete";
  stopInput();
  completedSections.add(sectionKey());
  savePersisted(COMPLETED_STORAGE_KEY, [...completedSections]);
  setText("playEarStatus", "You got it!");
  setText("playEarHint", `${accuracy}% note accuracy for this attempt.`);
  const result = document.getElementById("playEarResult");
  if (result) {
    result.hidden = false;
    result.innerHTML = `<strong>${currentSection().label}</strong><span>${currentSong().title} · ${currentSong().key}</span>${intervalAnswerHtml(currentSection().degrees)}<small>Relative interval sequence matched; key and rhythm were not scored.</small>`;
  }
  renderSections();
  updateButtons();
}

function updateDetectedNote(note: DetectedNote, matchedNotes: number): void {
  const octave = Math.floor(note.midiNote / 12) - 1;
  setText("playEarDetectedNote", `${getNoteName(note.noteIndex, "sharp")}${octave}`);
  setText("playEarDetectedInterval", `${matchedNotes} notes matched so far`);
}

function handleNote(note: DetectedNote | null): void {
  if (!listener.isListening() || state.status !== "guessing") return;
  const accepted = state.gate.update(note, performance.now());
  if (!accepted) return;
  const result = state.matcher.add(accepted.midiNote);
  state.matchedNotes = result.matchedNotes;
  updateDetectedNote(accepted, result.matchedNotes);
  renderProgress();
  setText("playEarStatus", result.matched ? `${result.matchedNotes} notes matched` : "That note doesn’t match yet");
  setText("playEarHint", result.matched ? "Keep following the phrase." : "Try that note again.");
  if (result.complete) completeRound(result.attemptAccuracy);
}

function resetRecognizedNotes(): void {
  state.matcher.reset();
  state.gate.reset();
  state.matchedNotes = 0;
  setText("playEarDetectedNote", "—");
  setText("playEarDetectedInterval", "Waiting for your guitar");
  setText("playEarStatus", "Recognized notes cleared");
  setText("playEarHint", "Play the phrase again from its first note.");
  renderProgress(0);
  updateButtons();
}

async function toggleListening(): Promise<void> {
  if (listener.isListening()) {
    stopInput();
    setText("playEarStatus", "Listening stopped");
    updateButtons();
    return;
  }
  if (!state.hasListened) return;
  prepareGuess();
  setText("playEarStatus", "Opening audio input…");
  try {
    await listener.start();
    setText("playEarStatus", "Play the section back");
    setText("playEarHint", "Start on any note; only the relative interval shape is scored.");
  } catch {
    setText("playEarStatus", "Audio input access is needed");
    setText("playEarHint", "Allow access, choose an input, then try again.");
  }
  updateButtons();
}

function selectMethod(method: GuessMethod): void {
  if (state.status === "complete" || state.status === "revealed" || method === state.method) return;
  stopInput();
  state.method = method;
  savePersisted(METHOD_STORAGE_KEY, method);
  setText("playEarStatus", method === "manual" ? "Enter the interval pattern" : "Play the section back");
  renderMethod();
}

function updateManualInput(field: HTMLInputElement): void {
  const digits = sanitizeDegreeInput(field.value, currentSection().degrees.length);
  field.value = digits;
  if (digits.length > 0) prepareGuess();
  state.manualInput = [...digits].map((digit, index) => {
    const existing = state.manualInput[index] ?? "";
    return `${accidentalPrefix(existing)}${digit}`;
  });
  state.manualJudgement = null;
  renderManualBoxes();
  renderProgress();
  setText("playEarStatus", `${state.manualInput.length} intervals entered`);
  updateButtons();
}

function cycleAccidental(index: number): void {
  const degree = state.manualInput[index];
  if (!degree) return;
  const values = [...state.manualInput];
  values[index] = `${nextDegreeAccidental(degree)}${degree.charAt(degree.length - 1)}`;
  state.manualInput = values;
  state.manualJudgement = null;
  renderManualBoxes();
  setText("playEarHint", `Interval ${index + 1} changed to ${formatDegree(values[index])}.`);
}

function checkManualGuess(): void {
  const section = currentSection();
  if (state.manualInput.length !== section.degrees.length) return;
  const result = evaluateDegreeGuess(state.manualInput, section.degrees, degreesFromFirstNote(section.notes));
  state.manualJudgement = result.correctPositions;
  renderManualBoxes();
  renderProgress(result.correctCount);
  if (result.complete) {
    completeRound(result.accuracy);
    return;
  }
  setText("playEarStatus", `${result.correctCount} of ${section.degrees.length} intervals are right`);
  setText("playEarHint", "Highlighted boxes need another listen.");
}

function revealAnswer(): void {
  stopInput();
  pauseVideo();
  state.status = "revealed";
  const result = document.getElementById("playEarResult");
  if (result) {
    result.hidden = false;
    result.innerHTML = `<strong>${currentSection().label}</strong><span>${currentSong().title} · ${currentSong().key}</span>${intervalAnswerHtml(currentSection().degrees)}<small>Listen again and notice the interval shape.</small>`;
  }
  setText("playEarStatus", "Answer revealed");
  setText("playEarHint", "Move to another section when you’re ready.");
  updateButtons();
}

function setupPlaybackEvents(): void {
  document.getElementById("playEarLoopBtn")?.addEventListener("click", () => void toggleLoop());
  document.getElementById("playEarGuessBtn")?.addEventListener("click", () => void toggleListening());
  document.getElementById("playEarResetNotesBtn")?.addEventListener("click", resetRecognizedNotes);
  document.getElementById("playEarCheckBtn")?.addEventListener("click", checkManualGuess);
  document.getElementById("playEarRevealBtn")?.addEventListener("click", revealAnswer);
}

function setupNavigationEvents(): void {
  document.getElementById("playEarMicMethodBtn")?.addEventListener("click", () => selectMethod("microphone"));
  document.getElementById("playEarManualMethodBtn")?.addEventListener("click", () => selectMethod("manual"));
  document.getElementById("playEarPreviousSectionBtn")?.addEventListener("click", () => selectSection(state.sectionIndex - 1));
  document.getElementById("playEarNextSectionBtn")?.addEventListener("click", () => selectSection(state.sectionIndex + 1));
  document.getElementById("playEarSongSelect")?.addEventListener("change", (event) => {
    const id = (event.target as HTMLSelectElement).value;
    selectSong(EAR_TRAINING_SONGS.findIndex((song) => song.id === id));
  });
  document.getElementById("playEarSectionTabs")?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-section-index]");
    if (button) selectSection(Number(button.dataset.sectionIndex));
  });
}

function setupManualEvents(): void {
  document.getElementById("playEarIntervalEntry")?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-play-ear-accidental]");
    if (button) cycleAccidental(Number(button.dataset.playEarAccidental));
    else document.getElementById("playEarIntervalInput")?.focus();
  });
  document.getElementById("playEarIntervalInput")?.addEventListener("input", (event) => {
    updateManualInput(event.target as HTMLInputElement);
  });
}

function setupPreferenceEvents(): void {
  document.getElementById("playEarPauseWhileGuessing")?.addEventListener("change", (event) => {
    pauseWhileGuessing = (event.target as HTMLInputElement).checked;
    savePersisted(PAUSE_STORAGE_KEY, pauseWhileGuessing);
  });
  window.addEventListener("hashchange", () => {
    if (window.location.hash.slice(1) !== "play-by-ear") {
      stopInput();
      pauseVideo();
    }
  });
}

function setupEvents(): void {
  setupPlaybackEvents();
  setupNavigationEvents();
  setupManualEvents();
  setupPreferenceEvents();
}

function loadMethod(): GuessMethod {
  return loadPersisted<GuessMethod>(METHOD_STORAGE_KEY, "microphone") === "manual" ? "manual" : "microphone";
}

export function initPlayByEarFeature(): void {
  const container = document.getElementById("play-by-ear-page");
  if (!container || EAR_TRAINING_SONGS.length === 0) return;
  container.innerHTML = playByEarPanelHtml();
  pauseWhileGuessing = loadPersisted(PAUSE_STORAGE_KEY, true);
  completedSections = new Set(loadPersisted<string[]>(COMPLETED_STORAGE_KEY, []));
  state = createState(0, 0, loadMethod());
  listener = createAudioListener({
    onNote: handleNote,
    onError() {
      setText("playEarStatus", "The selected audio input is unavailable");
      updateButtons();
    },
  });
  const pauseInput = document.getElementById("playEarPauseWhileGuessing") as HTMLInputElement | null;
  if (pauseInput) pauseInput.checked = pauseWhileGuessing;
  renderSong();
  resetRoundUi();
  setupEvents();
}
