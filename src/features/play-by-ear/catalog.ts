import { degreesFromTonic } from "../melodies/manualGuess";
import type { SynthTone } from "../melodies/tone";

export type EarSectionDifficulty = "easy" | "medium" | "hard";

export interface EarTrainingSection {
  id: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  difficulty: EarSectionDifficulty;
  bpm: number;
  notes: readonly number[];
  rhythm: readonly number[];
  rests?: readonly number[];
  synthTone?: SynthTone;
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
  if (details.notes.length !== details.rhythm.length) {
    throw new Error(`${details.id} needs one beat value per note`);
  }
  if (details.rests && details.notes.length !== details.rests.length) {
    throw new Error(`${details.id} needs one rest value per note`);
  }
  return { ...details, degrees: degreesFromTonic(details.notes, tonicMidi) };
}

const SEVEN_NATION_MAIN_RIFF = [52, 52, 55, 52, 50, 48, 47] as const;
const MY_GIRL_OPENING_MELODY = [60, 62, 64, 67, 69, 72] as const;
const SMOKE_ON_THE_WATER_MAIN_RIFF = [55, 58, 60, 55, 58, 61, 60, 55, 58, 60, 58, 55] as const;
const IRON_MAN_MAIN_RIFF = [59, 62, 62, 64, 64, 67, 66, 67, 66, 67, 66, 62, 62, 64, 64] as const;
const ANOTHER_ONE_BITES_THE_DUST_BASS_HOOK = [40, 40, 40, 40, 40, 40, 43, 40, 45] as const;
const BILLIE_JEAN_BASS_HOOK = [54, 61, 64, 66, 64, 61, 59, 61] as const;
const BEAT_IT_MAIN_HOOK = [51, 54, 56, 59, 58, 54, 51] as const;
const SWEET_DREAMS_SYNTH_HOOK = [48, 48, 55, 48, 56, 48, 55] as const;
const TAKE_ON_ME_CHORUS_VOCAL = [57, 59, 61, 64, 69] as const;
const COME_AS_YOU_ARE_OPENING_RIFF = [54, 54, 56, 57, 57, 56, 54, 52, 54] as const;
const TOXIC_MAIN_HOOK = [48, 48, 51, 48, 53, 51, 50, 51] as const;
const BAD_ROMANCE_VOCAL_HOOK = [57, 57, 57, 59, 60, 59, 57] as const;
const SHAPE_OF_YOU_MAIN_HOOK = [49, 52, 49, 52, 49, 52, 56, 54] as const;
const BLINDING_LIGHTS_SYNTH_HOOK = [53, 53, 60, 63, 65, 63, 60, 58] as const;
const SUNSHINE_OF_YOUR_LOVE_MAIN_RIFF = [50, 50, 48, 50, 57, 56, 55, 50, 53, 50] as const;
const SWEET_CHILD_OF_MINE_GUITAR_INTRO = [49, 61, 56, 54, 53, 56, 51, 56] as const;
const SATISFACTION_MAIN_RIFF = [52, 52, 52, 54, 55, 55, 54, 54] as const;
const SUPERSTITION_MAIN_RIFF = [51, 54, 56, 57, 56, 54, 51] as const;
const LAYLA_MAIN_RIFF = [57, 60, 62, 65, 62, 60, 62] as const;
const CRAZY_TRAIN_MAIN_RIFF = [54, 54, 61, 66, 62, 66, 61, 66] as const;
const COME_TOGETHER_MAIN_RIFF = [50, 50, 50, 57, 53, 50] as const;
const ENTER_SANDMAN_MAIN_RIFF = [52, 64, 58, 57, 55, 52] as const;
const HYSTERIA_BASS_INTRO = [57, 55, 57, 60, 57, 55, 57, 52] as const;
const SMOOTH_GUITAR_INTRO = [64, 65, 64, 62, 64, 60, 59, 57] as const;
const FEEL_GOOD_INC_BASSLINE = [51, 51, 54, 51, 49, 51, 56, 54] as const;
const DO_I_WANNA_KNOW_MAIN_RIFF = [55, 58, 60, 62, 65, 67] as const;
const UPTOWN_FUNK_MAIN_RIFF = [50, 50, 48, 50, 53, 50, 48, 50] as const;
const BAD_GUY_MAIN_RIFF = [55, 55, 55, 55, 55, 55, 55, 58, 60, 62] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_ONE = [48, 50, 50, 50, 48, 48, 50, 50, 50, 48] as const;
const POSSESS_YOUR_HEART_BASS_LINE_PART_TWO = [53, 50, 50, 50, 53, 50, 53, 55, 57] as const;
const POSSESS_YOUR_HEART_PIANO_MELODY = [62, 62, 60, 57, 53, 53, 55, 60] as const;

/**
 * Curated by hand from the linked performances. Fast songs may use half-time BPM so the
 * simplified phrase stays useful for learning; the relative rhythm remains unchanged.
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
        startSeconds: 4,
        endSeconds: 10,
        difficulty: "easy",
        tonicMidi: 60,
        bpm: 120,
        notes: MY_GIRL_OPENING_MELODY,
        rhythm: [1.5, 0.5, 0.5, 0.5, 0.5, 0.5],
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
        startSeconds: 6.5,
        endSeconds: 23,
        difficulty: "easy",
        tonicMidi: 55,
        bpm: 120,
        notes: SMOKE_ON_THE_WATER_MAIN_RIFF,
        rhythm: [1, 1, 1.5, 1, 1, 0.5, 2, 1, 1, 1.5, 1, 3.5],
      }),
    ],
  },
  {
    id: "iron-man",
    title: "Iron Man",
    artist: "Black Sabbath",
    performance: "Selected YouTube video",
    youtubeVideoId: "h194IFE-E9o",
    key: "B minor",
    sections: [
      section({
        id: "main-guitar-riff",
        label: "Main guitar riff",
        startSeconds: 28,
        endSeconds: 41.8,
        difficulty: "easy",
        tonicMidi: 47,
        bpm: 120,
        notes: IRON_MAN_MAIN_RIFF,
        rhythm: [2, 2, 1, 1, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 2],
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
        startSeconds: 12,
        endSeconds: 20.5,
        difficulty: "easy",
        tonicMidi: 52,
        bpm: 110,
        notes: ANOTHER_ONE_BITES_THE_DUST_BASS_HOOK,
        rhythm: [0.5, 0.5, 0.5, 0.25, 0.5, 0.5, 0.5, 0.25, 0.25],
        rests: [0.5, 0.5, 1.25, 0, 0, 0, 0, 0, 2],
        synthTone: "bass",
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
        startSeconds: 0,
        endSeconds: 14,
        difficulty: "easy",
        tonicMidi: 54,
        bpm: 117,
        notes: BILLIE_JEAN_BASS_HOOK,
        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
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
        startSeconds: 14,
        endSeconds: 28,
        difficulty: "easy",
        tonicMidi: 51,
        bpm: 139,
        notes: BEAT_IT_MAIN_HOOK,
        rhythm: [0.5, 0.5, 1, 1, 0.5, 0.5, 2],
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
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 48,
        bpm: 125,
        notes: SWEET_DREAMS_SYNTH_HOOK,
        rhythm: [0.5, 0.5, 1, 1, 1, 1, 2],
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
        startSeconds: 64,
        endSeconds: 80,
        difficulty: "easy",
        tonicMidi: 57,
        bpm: 85,
        notes: TAKE_ON_ME_CHORUS_VOCAL,
        rhythm: [0.5, 0.5, 1, 1, 2],
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
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 54,
        bpm: 120,
        notes: COME_AS_YOU_ARE_OPENING_RIFF,
        rhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1.5],
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
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 52,
        bpm: 124,
        notes: SEVEN_NATION_MAIN_RIFF,
        rhythm: [1, 0.5, 1.5, 0.5, 0.5, 2, 2],
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
        startSeconds: 0,
        endSeconds: 10,
        difficulty: "easy",
        tonicMidi: 48,
        bpm: 72,
        notes: TOXIC_MAIN_HOOK,
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 1.5],
      }),
    ],
  },
  {
    id: "bad-romance",
    title: "Bad Romance",
    artist: "Lady Gaga",
    performance: "Selected YouTube video",
    youtubeVideoId: "TTOPBQhrvtQ",
    key: "A minor",
    sections: [
      section({
        id: "vocal-hook",
        label: "Vocal hook",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 57,
        bpm: 119,
        notes: BAD_ROMANCE_VOCAL_HOOK,
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 0.5, 2],
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
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 49,
        bpm: 96,
        notes: SHAPE_OF_YOU_MAIN_HOOK,
        rhythm: [0.5, 1, 0.5, 1, 0.5, 0.5, 1, 2],
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
        startSeconds: 26,
        endSeconds: 42,
        difficulty: "easy",
        tonicMidi: 53,
        bpm: 86,
        notes: BLINDING_LIGHTS_SYNTH_HOOK,
        rhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1.5],
      }),
    ],
  },
  {
    id: "sunshine-of-your-love",
    title: "Sunshine of Your Love",
    artist: "Cream",
    performance: "Selected YouTube video",
    youtubeVideoId: "zt51rITH3EA",
    key: "D minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 14,
        difficulty: "easy",
        tonicMidi: 50,
        bpm: 115,
        notes: SUNSHINE_OF_YOUR_LOVE_MAIN_RIFF,
        rhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 2],
      }),
    ],
  },
  {
    id: "sweet-child-of-mine",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    performance: "Official music video",
    youtubeVideoId: "1w7OgIMMRc4",
    key: "Db major",
    sections: [
      section({
        id: "guitar-intro",
        label: "Guitar intro",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 49,
        bpm: 125,
        notes: SWEET_CHILD_OF_MINE_GUITAR_INTRO,
        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
      }),
    ],
  },
  {
    id: "satisfaction",
    title: "(I Can't Get No) Satisfaction",
    artist: "The Rolling Stones",
    performance: "Selected YouTube video",
    youtubeVideoId: "nrIPxlFzDi0",
    key: "E major",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 52,
        bpm: 136,
        notes: SATISFACTION_MAIN_RIFF,
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 1.5],
      }),
    ],
  },
  {
    id: "superstition",
    title: "Superstition",
    artist: "Stevie Wonder",
    performance: "Official audio",
    youtubeVideoId: "0CFuCYNx-1g",
    key: "Eb minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 13,
        endSeconds: 28,
        difficulty: "easy",
        tonicMidi: 51,
        bpm: 100,
        notes: SUPERSTITION_MAIN_RIFF,
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 2],
      }),
    ],
  },
  {
    id: "layla",
    title: "Layla",
    artist: "Derek and the Dominos",
    performance: "Selected YouTube video",
    youtubeVideoId: "uSquiIVLhrQ",
    key: "D minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 50,
        bpm: 116,
        notes: LAYLA_MAIN_RIFF,
        rhythm: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 2],
      }),
    ],
  },
  {
    id: "crazy-train",
    title: "Crazy Train",
    artist: "Ozzy Osbourne",
    performance: "Official music video",
    youtubeVideoId: "tMDFv5m18Pw",
    key: "F# minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 13,
        endSeconds: 28,
        difficulty: "easy",
        tonicMidi: 54,
        bpm: 138,
        notes: CRAZY_TRAIN_MAIN_RIFF,
        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
      }),
    ],
  },
  {
    id: "come-together",
    title: "Come Together",
    artist: "The Beatles",
    performance: "Official music video",
    youtubeVideoId: "45cYwDMibGo",
    key: "D minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 50,
        bpm: 82,
        notes: COME_TOGETHER_MAIN_RIFF,
        rhythm: [0.5, 0.5, 1, 1, 1, 2],
      }),
    ],
  },
  {
    id: "enter-sandman",
    title: "Enter Sandman",
    artist: "Metallica",
    performance: "Official music video",
    youtubeVideoId: "CD-E-LDc384",
    key: "E minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 30,
        difficulty: "easy",
        tonicMidi: 52,
        bpm: 123,
        notes: ENTER_SANDMAN_MAIN_RIFF,
        rhythm: [1, 1, 0.5, 0.5, 1, 2],
      }),
    ],
  },
  {
    id: "hysteria",
    title: "Hysteria",
    artist: "Muse",
    performance: "Official music video",
    youtubeVideoId: "3dm_5qWWDV8",
    key: "A minor",
    sections: [
      section({
        id: "bass-intro",
        label: "Bass intro",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 57,
        bpm: 93,
        notes: HYSTERIA_BASS_INTRO,
        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
      }),
    ],
  },
  {
    id: "smooth",
    title: "Smooth",
    artist: "Santana",
    performance: "Official music video",
    youtubeVideoId: "6Whgn_iE5uc",
    key: "A minor",
    sections: [
      section({
        id: "guitar-intro",
        label: "Guitar intro",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 57,
        bpm: 116,
        notes: SMOOTH_GUITAR_INTRO,
        rhythm: [0.5, 0.5, 1, 0.5, 0.5, 1, 1, 2],
      }),
    ],
  },
  {
    id: "feel-good-inc",
    title: "Feel Good Inc.",
    artist: "Gorillaz",
    performance: "Official music video",
    youtubeVideoId: "HyHNuVaZJ-k",
    key: "Eb minor",
    sections: [
      section({
        id: "bassline",
        label: "Bassline",
        startSeconds: 14,
        endSeconds: 28,
        difficulty: "easy",
        tonicMidi: 51,
        bpm: 139,
        notes: FEEL_GOOD_INC_BASSLINE,
        rhythm: [0.5, 0.5, 1, 1, 1, 1, 0.5, 1.5],
      }),
    ],
  },
  {
    id: "do-i-wanna-know",
    title: "Do I Wanna Know?",
    artist: "Arctic Monkeys",
    performance: "Official music video",
    youtubeVideoId: "pqrUQrAcfo4",
    key: "G minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 55,
        bpm: 85,
        notes: DO_I_WANNA_KNOW_MAIN_RIFF,
        rhythm: [1, 0.5, 0.5, 1, 0.5, 2],
      }),
    ],
  },
  {
    id: "uptown-funk",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    performance: "Official music video",
    youtubeVideoId: "OPf0YbXqDm0",
    key: "D minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 15,
        endSeconds: 30,
        difficulty: "easy",
        tonicMidi: 50,
        bpm: 115,
        notes: UPTOWN_FUNK_MAIN_RIFF,
        rhythm: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1.5],
      }),
    ],
  },
  {
    id: "bad-guy",
    title: "Bad Guy",
    artist: "Billie Eilish",
    performance: "Official music video",
    youtubeVideoId: "DyDfgMOUjCI",
    key: "G minor",
    sections: [
      section({
        id: "main-riff",
        label: "Main riff",
        startSeconds: 0,
        endSeconds: 15,
        difficulty: "easy",
        tonicMidi: 55,
        bpm: 135,
        notes: BAD_GUY_MAIN_RIFF,
        rhythm: [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 2],
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
        bpm: 120,
        notes: POSSESS_YOUR_HEART_BASS_LINE_PART_ONE,
        rhythm: [0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 1, 1.5],
      }),
      section({
        id: "opening-bass-line-part-two",
        label: "Opening bass line · Part 2",
        startSeconds: 24.5,
        endSeconds: 28.5,
        difficulty: "easy",
        tonicMidi: 50,
        bpm: 120,
        notes: POSSESS_YOUR_HEART_BASS_LINE_PART_TWO,
        rhythm: [0.5, 0.5, 0.5, 1, 0.5, 1, 0.5, 0.5, 2],
      }),
      section({
        id: "piano-melody",
        label: "Piano melody",
        startSeconds: 93,
        endSeconds: 100,
        difficulty: "easy",
        tonicMidi: 62,
        bpm: 120,
        notes: POSSESS_YOUR_HEART_PIANO_MELODY,
        rhythm: [1, 0.5, 0.5, 2, 1, 0.5, 0.5, 3],
      }),
    ],
  },
];
