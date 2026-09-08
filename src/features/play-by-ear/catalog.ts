import { degreesFromTonic } from "../melodies/manualGuess";

export type EarSectionDifficulty = "easy" | "medium" | "hard";

export interface EarTrainingSection {
  id: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  difficulty: EarSectionDifficulty;
  notes: readonly number[];
  degrees: readonly string[];
}

export interface EarTrainingSong {
  id: string;
  title: string;
  artist: string;
  performance: string;
  youtubeVideoId: string;
  key: string;
  sections: readonly EarTrainingSection[];
}

interface SectionDefinition extends Omit<EarTrainingSection, "degrees"> {
  tonicMidi: number;
}

function section(definition: SectionDefinition): EarTrainingSection {
  const { tonicMidi, ...details } = definition;
  return { ...details, degrees: degreesFromTonic(details.notes, tonicMidi) };
}

const SEVEN_NATION_MAIN_RIFF = [52, 52, 55, 52, 50, 48, 47] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_ONE = [48, 50, 50, 50, 48, 48, 50, 50, 50, 48] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_TWO = [53, 50, 50, 50, 53, 50, 53, 55, 57] as const;
const POSSESS_YOUR_HEART_PIANO_MELODY = [62, 62, 60, 57, 53, 53, 55, 60] as const;

/**
 * Curated by hand: YouTube supplies playback only; answers are stored here.
 */
export const EAR_TRAINING_SONGS: readonly EarTrainingSong[] = [
  {
    id: "seven-nation-army",
    title: "Seven Nation Army",
    artist: "The White Stripes",
    performance: "Official music video",
    youtubeVideoId: "0J2QdDbelmY",
    key: "E minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main phrase",
        startSeconds: 2,
        endSeconds: 10.5,
        difficulty: "easy",
        tonicMidi: 52,
        notes: SEVEN_NATION_MAIN_RIFF,
      }),
    ],
  },
  {
    id: "i-will-possess-your-heart",
    title: "I Will Possess Your Heart",
    artist: "Death Cab for Cutie",
    performance: "Album version video",
    youtubeVideoId: "pq-yP7mb8UE",
    key: "D minor",
    sections: [
      section({
        id: "opening-bass-line-part-one",
        label: "Opening bass line · Part 1",
        startSeconds: 21,
        endSeconds: 24.5,
        difficulty: "easy",
        tonicMidi: 50,
        notes: POSSESS_YOUR_HEART_BASS_LINE_PART_ONE,
      }),
      section({
        id: "opening-bass-line-part-two",
        label: "Opening bass line · Part 2",
        startSeconds: 24.5,
        endSeconds: 28.5,
        difficulty: "easy",
        tonicMidi: 50,
        notes: POSSESS_YOUR_HEART_BASS_LINE_PART_TWO,
      }),
      section({
        id: "piano-melody",
        label: "Piano melody",
        startSeconds: 93,
        endSeconds: 100,
        difficulty: "easy",
        tonicMidi: 62,
        notes: POSSESS_YOUR_HEART_PIANO_MELODY,
      }),
    ],
  },
];
