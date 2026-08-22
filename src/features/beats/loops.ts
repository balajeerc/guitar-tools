import { loadPersisted, savePersisted } from "../../shared/persist";
import { clampBpm } from "../metronome/beats";
import {
  DRUM_VOICES,
  normalizeLevels,
  normalizePattern,
  type BeatPattern,
  type TrackLevels,
} from "./pattern";

export interface BeatLoopState {
  bpm: number;
  pattern: BeatPattern;
  levels: TrackLevels;
}

export interface SavedBeatLoop extends BeatLoopState {
  id: string;
  name: string;
}

export interface SaveLoopResult {
  loops: SavedBeatLoop[];
  saved: SavedBeatLoop;
  overwritten: boolean;
}

const STORAGE_KEY = "beats-saved-loops";
export const MAX_LOOP_NAME_LENGTH = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBeatPattern(value: unknown): value is BeatPattern {
  if (!isRecord(value)) return false;
  return DRUM_VOICES.every((voice) => Array.isArray(value[voice]));
}

function isTrackLevels(value: unknown): value is TrackLevels {
  if (!isRecord(value)) return false;
  return DRUM_VOICES.every((voice) => typeof value[voice] === "number");
}

function normalizeSavedLoop(value: unknown): SavedBeatLoop | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  if (typeof value.bpm !== "number") return null;
  if (!isBeatPattern(value.pattern) || !isTrackLevels(value.levels)) return null;
  const name = value.name.trim().slice(0, MAX_LOOP_NAME_LENGTH);
  if (name.length === 0 || value.id.length === 0) return null;
  return {
    id: value.id,
    name,
    bpm: clampBpm(value.bpm),
    pattern: normalizePattern(value.pattern),
    levels: normalizeLevels(value.levels),
  };
}

export function loadSavedLoops(): SavedBeatLoop[] {
  const stored = loadPersisted<unknown>(STORAGE_KEY, []);
  if (!Array.isArray(stored)) return [];
  const loops: SavedBeatLoop[] = [];
  for (const value of stored) {
    const loop = normalizeSavedLoop(value);
    if (loop) loops.push(loop);
  }
  return loops;
}

function snapshotLoop(
  id: string,
  name: string,
  state: BeatLoopState,
): SavedBeatLoop {
  return {
    id,
    name,
    bpm: clampBpm(state.bpm),
    pattern: normalizePattern(state.pattern),
    levels: normalizeLevels(state.levels),
  };
}

export function saveBeatLoop(
  loops: SavedBeatLoop[],
  name: string,
  state: BeatLoopState,
): SaveLoopResult {
  const normalizedName = name.trim().slice(0, MAX_LOOP_NAME_LENGTH);
  const existingIndex = loops.findIndex(
    (loop) => loop.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
  );
  const existing = loops[existingIndex];
  const saved = snapshotLoop(
    existing?.id ?? `beat-loop-${Date.now()}`,
    normalizedName,
    state,
  );
  const nextLoops = [...loops];
  if (existingIndex >= 0) nextLoops[existingIndex] = saved;
  else nextLoops.push(saved);
  savePersisted(STORAGE_KEY, nextLoops);
  return { loops: nextLoops, saved, overwritten: existingIndex >= 0 };
}

export function deleteBeatLoop(
  loops: SavedBeatLoop[],
  id: string,
): SavedBeatLoop[] {
  const nextLoops = loops.filter((loop) => loop.id !== id);
  savePersisted(STORAGE_KEY, nextLoops);
  return nextLoops;
}
