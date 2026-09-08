import type { Melody } from "../melodies/catalog";
import { createMelodyPlayer } from "../melodies/playback";
import { loadMelodyTone } from "../melodies/toneControl";
import type { EarTrainingSection, EarTrainingSong } from "./catalog";

export interface SimplifiedVersionPlayer {
  isPlaying: () => boolean;
  play: (song: EarTrainingSong, section: EarTrainingSection) => Promise<void>;
  stop: () => void;
}

const SIMPLIFIED_VERSION_BPM = 112;

function asMelody(song: EarTrainingSong, section: EarTrainingSection): Melody {
  return {
    id: `${song.id}/${section.id}`,
    title: section.label,
    attribution: song.artist,
    key: song.key,
    difficulty: section.difficulty,
    bpm: SIMPLIFIED_VERSION_BPM,
    notes: section.notes.map((midi) => ({ midi, beats: 1 })),
    degrees: section.degrees,
  };
}

export function createSimplifiedVersionPlayer(): SimplifiedVersionPlayer {
  const player = createMelodyPlayer();
  let playing = false;
  let playbackId = 0;

  function stop(): void {
    playbackId += 1;
    playing = false;
    player.stop();
  }

  async function play(song: EarTrainingSong, section: EarTrainingSection): Promise<void> {
    if (playing) return;
    const currentPlaybackId = ++playbackId;
    playing = true;
    try {
      await player.play(asMelody(song, section), loadMelodyTone());
    } finally {
      if (currentPlaybackId === playbackId) playing = false;
    }
  }

  return { isPlaying: () => playing, play, stop };
}
