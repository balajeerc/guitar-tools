import { createAudioListener, type AudioListenerHandle } from "../../shared/audioListener";
import { loadPersisted, savePersisted } from "../../shared/persist";
import type { DetectedNote } from "../note-detection/noteMapper";
import { createNoteGate, type NoteGate } from "../melodies/noteGate";
import { degreesFromFirstNote, evaluateDegreeGuess, sanitizeDegreeInput } from "../melodies/manualGuess";
import type { MelodyMatcher } from "../melodies/matcher";
import {
  accidentalPrefix, degreeBoxesHtml, formatDegree, intervalAnswerHtml, nextDegreeAccidental,
  setHidden, setPressed, setText,
} from "../melodies/ui";
import { EAR_TRAINING_SONGS, type EarTrainingSection, type EarTrainingSong } from "./catalog";
import { createHeardNoteQueue, type HeardNoteQueue } from "./heardNoteQueue";
import { playByEarPanelHtml } from "./panel";
import { createYouTubeSectionPlayer, type YouTubeSection, type YouTubeSectionPlayer } from "./youtubePlayer";
import { createSlidingMelodyMatcher } from "./slidingMatcher";
import { createSimplifiedVersionPlayer } from "./simplifiedPlayer";
import {
  isPlayByEarRoute, playByEarSongId, replacePlayByEarSongUrl, setPlayByEarSongUrl,
} from "./songRoute";
import {
  renderDetectedNote, renderPlayByEarProgress, renderPlayByEarSections, renderPlayByEarSong,
  updatePlayByEarButtons,
} from "./view";

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
  heardNotes: HeardNoteQueue;
}

const METHOD_STORAGE_KEY = "play-by-ear-guess-method";
const PAUSE_STORAGE_KEY = "play-by-ear-pause-video";
const COMPLETED_STORAGE_KEY = "play-by-ear-completed-sections";
const AUTO_CLEAR_STORAGE_KEY = "play-by-ear-auto-clear-notes";
const PLAY_BY_EAR_STABLE_NOTE_MS = 50;
const HEARD_NOTES_CLEAR_DELAY_MS = 5000;
const simplifiedPlayer = createSimplifiedVersionPlayer();

let state: GameState;
let listener: AudioListenerHandle;
let player: YouTubeSectionPlayer | null = null;
let pauseWhileGuessing = true;
let completedSections = new Set<string>();
let playbackRates: readonly number[] = [1];
let playbackRate = 1;
let autoClearNotes = true;

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
    heardNotes: createHeardNoteQueue(
      section.notes.length,
      HEARD_NOTES_CLEAR_DELAY_MS,
      autoClearNotes,
      autoClearRecognizedNotes,
    ),
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
  renderPlayByEarProgress(value, currentSection().notes.length, state.method === "manual" ? "entered" : "notes");
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
  updatePlayByEarButtons({
    videoLooping: state.videoLooping, playerLoading: state.playerLoading, hasVideoPlayer: player !== null,
    playbackRates, playbackRate, simplifiedPlayback: simplifiedPlayer.playingSource(), listening: listener.isListening(),
    hasListened: state.hasListened, finished: state.status === "complete" || state.status === "revealed",
    hasHeardNotes: state.heardNotes.values().length > 0, manualInputLength: state.manualInput.length,
    expectedNotes: currentSection().notes.length, sectionIndex: state.sectionIndex,
    sectionCount: currentSong().sections.length,
  });
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
  renderPlayByEarSections(currentSong(), state.sectionIndex, completedSections);
}

function renderSong(): void {
  renderPlayByEarSong(currentSong(), EAR_TRAINING_SONGS, state.sectionIndex, completedSections);
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
  state.heardNotes.dispose();
  simplifiedPlayer.stop();
  pauseVideo();
  state = createState(state.songIndex, index, state.method);
  player?.cue(youtubeSection());
  resetRoundUi();
}

function selectSong(index: number): void {
  if (index < 0 || index >= EAR_TRAINING_SONGS.length) return;
  setPlayByEarSongUrl(EAR_TRAINING_SONGS[index].id);
  if (index === state.songIndex) return;
  stopInput();
  state.heardNotes.dispose();
  simplifiedPlayer.stop();
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
      onPlaybackRateChange(rate) {
        playbackRate = rate;
        updateButtons();
      },
      onError(message) {
        state.videoLooping = false;
        setText("playEarVideoStatus", message);
        updateButtons();
      },
    });
    playbackRates = player.getAvailablePlaybackRates();
    playbackRate = player.getPlaybackRate();
    return player;
  } finally {
    state.playerLoading = false;
    updateButtons();
  }
}

async function playOrRestartLoop(): Promise<void> {
  simplifiedPlayer.stop();
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

async function playSimplifiedVersion(): Promise<void> {
  if (simplifiedPlayer.isPlaying()) return;
  pauseVideo();
  const playback = simplifiedPlayer.play(currentSong(), currentSection());
  updateButtons();
  try {
    await playback;
  } catch {
    setText("playEarVideoStatus", "The simplified version could not be played.");
  } finally {
    updateButtons();
  }
}

async function changePlaybackRate(direction: -1 | 1): Promise<void> {
  try {
    const videoPlayer = await ensurePlayer();
    playbackRates = videoPlayer.getAvailablePlaybackRates();
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = Math.max(0, Math.min(currentIndex + direction, playbackRates.length - 1));
    const nextRate = playbackRates[nextIndex];
    videoPlayer.setPlaybackRate(nextRate);
  } catch {
    setText("playEarVideoStatus", "Playback speed could not be changed.");
  }
  updateButtons();
}

function prepareGuess(): void {
  simplifiedPlayer.stop();
  if (pauseWhileGuessing && state.videoLooping) pauseVideo();
  state.status = "guessing";
}

function completeRound(accuracy: number): void {
  state.status = "complete";
  stopInput();
  state.heardNotes.dispose();
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

function handleNote(note: DetectedNote | null): void {
  if (!listener.isListening() || state.status !== "guessing" || simplifiedPlayer.isPlaying()) return;
  const accepted = state.gate.update(note, performance.now());
  if (!accepted) return;
  state.heardNotes.add(accepted.midiNote);
  const result = state.matcher.add(accepted.midiNote);
  state.matchedNotes = result.matchedNotes;
  renderDetectedNote(accepted, result.matchedNotes);
  renderProgress();
  updateButtons();
  setText("playEarStatus", result.matched ? `${result.matchedNotes} notes matched` : "That note doesn’t match yet");
  setText("playEarHint", result.matched ? "Keep following the phrase." : "Try that note again.");
  if (result.complete) completeRound(result.attemptAccuracy);
}

function clearRecognizedNotes(status: string, hint: string): void {
  state.heardNotes.clear();
  state.matcher.reset();
  state.gate.reset();
  state.matchedNotes = 0;
  setText("playEarDetectedNote", "—");
  setText("playEarDetectedInterval", "Waiting for your guitar");
  setText("playEarStatus", status);
  setText("playEarHint", hint);
  renderProgress(0);
  updateButtons();
}

function resetRecognizedNotes(): void {
  clearRecognizedNotes("Recognized notes cleared", "Play the phrase again from its first note.");
}

function autoClearRecognizedNotes(): void {
  if (!autoClearNotes || state.status !== "guessing") return;
  clearRecognizedNotes("Recognized notes cleared after 5 seconds", "Play again, or turn off auto-clear.");
}

async function playHeardNotes(): Promise<void> {
  const notes = state.heardNotes.values();
  if (notes.length === 0 || simplifiedPlayer.isPlaying()) return;
  const playback = simplifiedPlayer.playNotes(notes);
  updateButtons();
  try {
    await playback;
  } catch {
    setText("playEarStatus", "The heard notes could not be played.");
  } finally {
    updateButtons();
  }
}

async function toggleListening(): Promise<void> {
  if (listener.isListening()) {
    stopInput();
    setText("playEarStatus", "Listening stopped");
    updateButtons();
    return;
  }
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
  state.heardNotes.dispose();
  simplifiedPlayer.stop();
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

function setupRevealEvents(): void {
  for (const id of ["playEarRevealBtn", "playEarManualRevealBtn"])
    document.getElementById(id)?.addEventListener("click", revealAnswer);
}

function setupPlaybackEvents(): void {
  document.getElementById("playEarLoopBtn")?.addEventListener("click", () => void playOrRestartLoop());
  document.getElementById("playEarSlowerBtn")?.addEventListener("click", () => void changePlaybackRate(-1));
  document.getElementById("playEarFasterBtn")?.addEventListener("click", () => void changePlaybackRate(1));
  document.getElementById("playEarSimplifiedBtn")?.addEventListener("click", () => void playSimplifiedVersion());
  document.getElementById("playEarGuessBtn")?.addEventListener("click", () => void toggleListening());
  document.getElementById("playEarResetNotesBtn")?.addEventListener("click", resetRecognizedNotes);
  document.getElementById("playEarPlayHeardBtn")?.addEventListener("click", () => void playHeardNotes());
  document.getElementById("playEarCheckBtn")?.addEventListener("click", checkManualGuess);
  setupRevealEvents();
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
  document.getElementById("playEarAutoClearNotes")?.addEventListener("change", (event) => {
    autoClearNotes = (event.target as HTMLInputElement).checked;
    state.heardNotes.setAutoClear(autoClearNotes);
    savePersisted(AUTO_CLEAR_STORAGE_KEY, autoClearNotes);
  });
  window.addEventListener("hashchange", () => {
    if (isPlayByEarRoute()) {
      const songId = playByEarSongId();
      if (songId) selectSong(EAR_TRAINING_SONGS.findIndex((song) => song.id === songId));
      else replacePlayByEarSongUrl(currentSong().id);
    } else {
      stopInput();
      state.heardNotes.dispose();
      simplifiedPlayer.stop();
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
  autoClearNotes = loadPersisted(AUTO_CLEAR_STORAGE_KEY, true);
  completedSections = new Set(loadPersisted<string[]>(COMPLETED_STORAGE_KEY, []));
  const songId = playByEarSongId();
  const songIndex = EAR_TRAINING_SONGS.findIndex((song) => song.id === songId);
  state = createState(Math.max(0, songIndex), 0, loadMethod());
  if (isPlayByEarRoute() && !songId) replacePlayByEarSongUrl(currentSong().id);
  listener = createAudioListener({
    onNote: handleNote,
    onError() {
      setText("playEarStatus", "The selected audio input is unavailable");
      updateButtons();
    },
  });
  const pauseInput = document.getElementById("playEarPauseWhileGuessing") as HTMLInputElement | null;
  if (pauseInput) pauseInput.checked = pauseWhileGuessing;
  const autoClearInput = document.getElementById("playEarAutoClearNotes") as HTMLInputElement | null;
  if (autoClearInput) autoClearInput.checked = autoClearNotes;
  renderSong();
  resetRoundUi();
  setupEvents();
}
