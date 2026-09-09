import type { Melody } from "../melodies/catalog";
import { createMelodyPlayer } from "../melodies/playback";
import type { SynthTone } from "../melodies/tone";
import { loadMelodyTone } from "../melodies/toneControl";
import type { EarTrainingSection, EarTrainingSong } from "./catalog";

export interface SimplifiedVersionPlayer {
  isPlaying: () => boolean;
  playingSource: () => SimplifiedPlaybackSource;
  play: (song: EarTrainingSong, section: EarTrainingSection) => Promise<void>;
  playNotes: (notes: readonly number[]) => Promise<void>;
  stop: () => void;
}

export type SimplifiedPlaybackSource = "expected" | "heard" | null;

const HEARD_NOTES_BPM = 112;

function asMelody(song: EarTrainingSong, section: EarTrainingSection): Melody {
  return {
    id: `${song.id}/${section.id}`,
    title: section.label,
    attribution: song.artist,
    key: song.key,
    difficulty: section.difficulty,
    bpm: section.bpm,
    notes: section.notes.map((midi, index) => ({
      midi,
      beats: section.rhythm[index],
      restAfterBeats: section.rests?.[index],
    })),
    degrees: section.degrees,
  };
}

function asHeardNotesMelody(notes: readonly number[]): Melody {
  return {
    id: "heard-notes",
    title: "Heard notes",
    attribution: "Your input",
    key: "",
    difficulty: "easy",
    bpm: HEARD_NOTES_BPM,
    notes: notes.map((midi) => ({ midi, beats: 1 })),
    degrees: [],
  };
}

export function createSimplifiedVersionPlayer(): SimplifiedVersionPlayer {
  const player = createMelodyPlayer();
  let source: SimplifiedPlaybackSource = null;
  let playbackId = 0;

  function stop(): void {
    playbackId += 1;
    source = null;
    player.stop();
  }

  async function playMelody(
    melody: Melody,
    nextSource: Exclude<SimplifiedPlaybackSource, null>,
    tone: SynthTone,
  ): Promise<void> {
    if (source !== null) return;
    const currentPlaybackId = ++playbackId;
    source = nextSource;
    try {
      await player.play(melody, tone);
    } finally {
      if (currentPlaybackId === playbackId) source = null;
    }
  }

  return {
    isPlaying: () => source !== null,
    playingSource: () => source,
    play: (song, section) => playMelody(asMelody(song, section), "expected", section.synthTone ?? loadMelodyTone()),
    playNotes: (notes) => playMelody(asHeardNotesMelody(notes), "heard", loadMelodyTone()),
    stop,
  };
}
