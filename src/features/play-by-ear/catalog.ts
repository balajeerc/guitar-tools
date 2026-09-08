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
        endSeconds: 9,
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
        endSeconds: 20,
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
    performance: "Selected YouTube video",
    youtubeVideoId: "h194IFE-E9o",
    key: "B minor",
    sections: [
      section({
        id: "main-guitar-riff",
        label: "Main guitar riff",
        startSeconds: 24,
        endSeconds: 40,
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
        startSeconds: 0,
        endSeconds: 13,
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
        startSeconds: 0,
        endSeconds: 14,
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
        startSeconds: 14,
        endSeconds: 28,
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
        endSeconds: 15,
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
        startSeconds: 64,
        endSeconds: 80,
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
        endSeconds: 15,
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
        startSeconds: 0,
        endSeconds: 15,
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
        startSeconds: 0,
        endSeconds: 10,
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
        endSeconds: 15,
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
        startSeconds: 26,
        endSeconds: 42,
        difficulty: "easy",
        tonicMidi: 53,
        notes: BLINDING_LIGHTS_SYNTH_HOOK,
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
        notes: SUNSHINE_OF_YOUR_LOVE_MAIN_RIFF,
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
        notes: SWEET_CHILD_OF_MINE_GUITAR_INTRO,
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
        notes: SATISFACTION_MAIN_RIFF,
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
        notes: SUPERSTITION_MAIN_RIFF,
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
        notes: LAYLA_MAIN_RIFF,
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
        notes: CRAZY_TRAIN_MAIN_RIFF,
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
        notes: COME_TOGETHER_MAIN_RIFF,
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
        notes: ENTER_SANDMAN_MAIN_RIFF,
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
        notes: HYSTERIA_BASS_INTRO,
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
        notes: SMOOTH_GUITAR_INTRO,
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
        notes: FEEL_GOOD_INC_BASSLINE,
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
        notes: DO_I_WANNA_KNOW_MAIN_RIFF,
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
        notes: UPTOWN_FUNK_MAIN_RIFF,
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
        notes: BAD_GUY_MAIN_RIFF,
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
