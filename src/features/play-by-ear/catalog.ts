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
const MY_GIRL_OPENING_MELODY = [60, 62, 64, 67, 69, 72] as const;
const SMOKE_ON_THE_WATER_MAIN_RIFF = [55, 58, 60, 55, 58, 61, 60] as const;
const IRON_MAN_MAIN_RIFF = [47, 47, 50, 50, 52, 52] as const;
const ANOTHER_ONE_BITES_THE_DUST_BASS_HOOK = [52, 52, 52, 52, 55, 52, 57] as const;
const BILLIE_JEAN_BASS_HOOK = [54, 61, 64, 66, 64, 61, 59, 61] as const;
const BEAT_IT_MAIN_HOOK = [51, 54, 56, 59, 58, 54, 51] as const;
const SWEET_DREAMS_SYNTH_HOOK = [48, 48, 55, 48, 56, 48, 55] as const;
const TAKE_ON_ME_CHORUS_VOCAL = [57, 59, 61, 64, 69] as const;
const COME_AS_YOU_ARE_OPENING_RIFF = [54, 54, 56, 57, 57, 56, 54, 52, 54] as const;
const TOXIC_MAIN_HOOK = [48, 48, 51, 48, 53, 51, 50, 51] as const;
const BAD_ROMANCE_VOCAL_HOOK = [57, 57, 57, 59, 60, 59, 57] as const;
const SHAPE_OF_YOU_MAIN_HOOK = [49, 52, 49, 52, 49, 52, 56, 54] as const;
const BLINDING_LIGHTS_SYNTH_HOOK = [53, 53, 60, 63, 65, 63, 60, 58, 60] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_ONE = [48, 50, 50, 50, 48, 48, 50, 50, 50, 48] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_TWO = [53, 50, 50, 50, 53, 50, 53, 55, 57] as const;
const POSSESS_YOUR_HEART_PIANO_MELODY = [62, 62, 60, 57, 53, 53, 55, 60] as const;

/**
 * Curated by hand: YouTube supplies playback only; answers are stored here.
 */
export const EAR_TRAINING_SONGS: readonly EarTrainingSong[] = [
  {
    id: "my-girl",
    title: "My Girl",
    artist: "The Temptations",
    performance: "Official lyric video",
    youtubeVideoId: "y3KJ7d2qBoA",
    key: "C major",
    sections: [
      section({
        id: "opening-guitar-melody",
        label: "Opening guitar melody",
        startSeconds: 0,
        endSeconds: 8,
        difficulty: "easy",
        tonicMidi: 60,
        notes: MY_GIRL_OPENING_MELODY,
      }),
    ],
  },
  {
    id: "smoke-on-the-water",
    title: "Smoke on the Water",
    artist: "Deep Purple",
    performance: "Official music video · 2024 remix",
    youtubeVideoId: "Q2FzZSBD5LE",
    key: "G minor",
    sections: [
      section({
        id: "main-guitar-riff",
        label: "Main guitar riff",
        startSeconds: 0,
        endSeconds: 9,
        difficulty: "easy",
        tonicMidi: 55,
        notes: SMOKE_ON_THE_WATER_MAIN_RIFF,
      }),
    ],
  },
  {
    id: "iron-man",
    title: "Iron Man",
    artist: "Black Sabbath",
    performance: "Official audio · 2012 remaster",
    youtubeVideoId: "pOfBdvuky1s",
    key: "B minor",
    sections: [
      section({
        id: "main-guitar-riff",
        label: "Main guitar riff",
        startSeconds: 28,
        endSeconds: 36,
        difficulty: "easy",
        tonicMidi: 47,
        notes: IRON_MAN_MAIN_RIFF,
      }),
    ],
  },
  {
    id: "another-one-bites-the-dust",
    title: "Another One Bites the Dust",
    artist: "Queen",
    performance: "Official music video",
    youtubeVideoId: "rY0WxgSXdEE",
    key: "E minor",
    sections: [
      section({
        id: "bass-hook",
        label: "Bass hook",
        startSeconds: 7.5,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 52,
        notes: ANOTHER_ONE_BITES_THE_DUST_BASS_HOOK,
      }),
    ],
  },
  {
    id: "billie-jean",
    title: "Billie Jean",
    artist: "Michael Jackson",
    performance: "Official music video",
    youtubeVideoId: "Zi_XLOBDo_Y",
    key: "F# minor",
    sections: [
      section({
        id: "bass-hook",
        label: "Bass hook",
        startSeconds: 11,
        endSeconds: 20,
        difficulty: "easy",
        tonicMidi: 54,
        notes: BILLIE_JEAN_BASS_HOOK,
      }),
    ],
  },
  {
    id: "beat-it",
    title: "Beat It",
    artist: "Michael Jackson",
    performance: "Official music video",
    youtubeVideoId: "oRdxUFDoQe0",
    key: "Eb minor",
    sections: [
      section({
        id: "main-hook",
        label: "Main hook",
        startSeconds: 43,
        endSeconds: 51,
        difficulty: "easy",
        tonicMidi: 51,
        notes: BEAT_IT_MAIN_HOOK,
      }),
    ],
  },
  {
    id: "sweet-dreams",
    title: "Sweet Dreams (Are Made of This)",
    artist: "Eurythmics",
    performance: "Official music video",
    youtubeVideoId: "qeMFqkcPYcg",
    key: "C minor",
    sections: [
      section({
        id: "synth-hook",
        label: "Synth hook",
        startSeconds: 0,
        endSeconds: 8,
        difficulty: "easy",
        tonicMidi: 48,
        notes: SWEET_DREAMS_SYNTH_HOOK,
      }),
    ],
  },
  {
    id: "take-on-me",
    title: "Take On Me",
    artist: "a-ha",
    performance: "Official music video",
    youtubeVideoId: "djV11Xbc914",
    key: "A major",
    sections: [
      section({
        id: "chorus-vocal",
        label: "Chorus vocal",
        startSeconds: 63,
        endSeconds: 71,
        difficulty: "easy",
        tonicMidi: 57,
        notes: TAKE_ON_ME_CHORUS_VOCAL,
      }),
    ],
  },
  {
    id: "come-as-you-are",
    title: "Come As You Are",
    artist: "Nirvana",
    performance: "Official music video",
    youtubeVideoId: "vabnZ9-ex7o",
    key: "F# minor",
    sections: [
      section({
        id: "opening-guitar-riff",
        label: "Opening guitar riff",
        startSeconds: 0,
        endSeconds: 8,
        difficulty: "easy",
        tonicMidi: 54,
        notes: COME_AS_YOU_ARE_OPENING_RIFF,
      }),
    ],
  },
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
    id: "toxic",
    title: "Toxic",
    artist: "Britney Spears",
    performance: "Official music video",
    youtubeVideoId: "LOZuxwVk7TU",
    key: "C minor",
    sections: [
      section({
        id: "main-hook",
        label: "Main hook",
        startSeconds: 9,
        endSeconds: 17,
        difficulty: "easy",
        tonicMidi: 48,
        notes: TOXIC_MAIN_HOOK,
      }),
    ],
  },
  {
    id: "bad-romance",
    title: "Bad Romance",
    artist: "Lady Gaga",
    performance: "Official music video",
    youtubeVideoId: "qrO4YZeyl0I",
    key: "A minor",
    sections: [
      section({
        id: "vocal-hook",
        label: "Vocal hook",
        startSeconds: 43,
        endSeconds: 51,
        difficulty: "easy",
        tonicMidi: 57,
        notes: BAD_ROMANCE_VOCAL_HOOK,
      }),
    ],
  },
  {
    id: "shape-of-you",
    title: "Shape of You",
    artist: "Ed Sheeran",
    performance: "Official music video",
    youtubeVideoId: "JGwWNGJdvx8",
    key: "C# minor",
    sections: [
      section({
        id: "main-hook",
        label: "Main hook",
        startSeconds: 0,
        endSeconds: 8,
        difficulty: "easy",
        tonicMidi: 49,
        notes: SHAPE_OF_YOU_MAIN_HOOK,
      }),
    ],
  },
  {
    id: "blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    performance: "Official music video",
    youtubeVideoId: "4NRXx6U8ABQ",
    key: "F minor",
    sections: [
      section({
        id: "synth-hook",
        label: "Synth hook",
        startSeconds: 29,
        endSeconds: 38,
        difficulty: "easy",
        tonicMidi: 53,
        notes: BLINDING_LIGHTS_SYNTH_HOOK,
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
