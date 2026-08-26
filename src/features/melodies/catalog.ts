export interface MelodyNote {
  midi: number;
  beats: number;
}

export type MelodyDifficulty = "easy" | "medium" | "hard";

export interface Melody {
  id: string;
  title: string;
  attribution: string;
  key: string;
  difficulty: MelodyDifficulty;
  bpm: number;
  notes: readonly MelodyNote[];
  degrees: readonly string[];
}

const note = (midi: number, beats = 1): MelodyNote => ({ midi, beats });
const phrase = (pitches: readonly number[], beats = 0.75): MelodyNote[] =>
  pitches.map((midi) => note(midi, beats));
const CHROMATIC_DEGREES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"] as const;

interface PhraseDefinition extends Omit<Melody, "notes" | "degrees"> {
  pitches: readonly number[];
  tonic: number;
  beats?: number;
}

function melody(definition: PhraseDefinition): Melody {
  const { pitches, tonic, beats, ...details } = definition;
  const degrees = pitches.map((midi) => CHROMATIC_DEGREES[((midi - tonic) % 12 + 12) % 12]);
  return { ...details, notes: phrase(pitches, beats), degrees };
}

/** Public-domain phrases grouped by how familiar and melodically demanding they are. */
const MELODIES: readonly Melody[] = [
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    attribution: "Ludwig van Beethoven",
    key: "C major",
    difficulty: "easy",
    bpm: 112,
    notes: [note(64), note(64), note(65), note(67), note(67), note(65), note(64), note(62)],
    degrees: ["3", "3", "4", "5", "5", "4", "3", "2"],
  },
  {
    id: "beethovens-fifth",
    title: "Symphony No. 5",
    attribution: "Ludwig van Beethoven",
    key: "C minor",
    difficulty: "easy",
    bpm: 108,
    notes: [note(67, 0.5), note(67, 0.5), note(67, 0.5), note(63, 2), note(65, 0.5), note(65, 0.5), note(65, 0.5), note(62, 2)],
    degrees: ["5", "5", "5", "b3", "4", "4", "4", "2"],
  },
  {
    id: "twinkle",
    title: "Twinkle, Twinkle, Little Star",
    attribution: "Traditional",
    key: "C major",
    difficulty: "easy",
    bpm: 104,
    notes: [note(60), note(60), note(67), note(67), note(69), note(69), note(67, 2)],
    degrees: ["1", "1", "5", "5", "6", "6", "5"],
  },
  {
    id: "fur-elise",
    title: "Für Elise",
    attribution: "Ludwig van Beethoven",
    key: "A minor",
    difficulty: "easy",
    bpm: 96,
    notes: [note(76, 0.5), note(75, 0.5), note(76, 0.5), note(75, 0.5), note(76, 0.5), note(71, 0.5), note(74, 0.5), note(72, 0.5), note(69, 1.5)],
    degrees: ["5", "b5", "5", "b5", "5", "2", "4", "b3", "1"],
  },
  {
    id: "jingle-bells",
    title: "Jingle Bells",
    attribution: "James Lord Pierpont",
    key: "C major",
    difficulty: "easy",
    bpm: 116,
    notes: [note(64), note(64), note(64, 2), note(64), note(64), note(64, 2), note(64), note(67), note(60), note(62), note(64, 2)],
    degrees: ["3", "3", "3", "3", "3", "3", "3", "5", "1", "2", "3"],
  },
  {
    id: "happy-birthday",
    title: "Happy Birthday to You",
    attribution: "Patty Hill and Mildred J. Hill",
    key: "C major",
    difficulty: "easy",
    bpm: 104,
    notes: [note(67, 0.75), note(67, 0.25), note(69), note(67), note(72), note(71, 2)],
    degrees: ["5", "5", "6", "5", "1", "7"],
  },
  {
    id: "mary-lamb",
    title: "Mary Had a Little Lamb",
    attribution: "Traditional",
    key: "C major",
    difficulty: "easy",
    bpm: 112,
    notes: [note(64), note(62), note(60), note(62), note(64), note(64), note(64, 2)],
    degrees: ["3", "2", "1", "2", "3", "3", "3"],
  },
  {
    id: "frere-jacques",
    title: "Frère Jacques",
    attribution: "Traditional",
    key: "C major",
    difficulty: "easy",
    bpm: 108,
    notes: [note(60), note(62), note(64), note(60), note(60), note(62), note(64), note(60)],
    degrees: ["1", "2", "3", "1", "1", "2", "3", "1"],
  },
  melody({
    id: "row-your-boat", title: "Row, Row, Row Your Boat", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 104, tonic: 60, pitches: [60, 60, 60, 62, 64, 64, 62, 64, 65, 67],
  }),
  melody({
    id: "london-bridge", title: "London Bridge Is Falling Down", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 108, tonic: 60, pitches: [67, 69, 67, 65, 64, 65, 67, 62, 64, 65, 64, 65, 67],
  }),
  melody({
    id: "amazing-grace", title: "Amazing Grace", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 84, tonic: 60, pitches: [67, 72, 76, 72, 76, 74, 72, 69, 67, 67, 72, 76, 72, 76, 74, 79],
  }),
  melody({
    id: "when-the-saints", title: "When the Saints Go Marching In", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 112, tonic: 60, pitches: [60, 64, 65, 67, 60, 64, 65, 67, 60, 64, 65, 67, 64, 60, 64, 62],
  }),
  melody({
    id: "hot-cross-buns", title: "Hot Cross Buns", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 100, tonic: 60, pitches: [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60],
  }),
  melody({
    id: "old-macdonald", title: "Old MacDonald Had a Farm", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 112, tonic: 60, pitches: [60, 60, 60, 67, 69, 69, 67, 64, 64, 62, 62, 60],
  }),
  melody({
    id: "this-old-man", title: "This Old Man", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 108, tonic: 60, pitches: [67, 64, 67, 67, 64, 67, 69, 67, 65, 64, 62, 64, 65, 64],
  }),
  melody({
    id: "pop-goes-the-weasel", title: "Pop Goes the Weasel", attribution: "Traditional", key: "C major",
    difficulty: "easy", bpm: 116, tonic: 60, pitches: [60, 60, 62, 62, 64, 67, 64, 60, 60, 62, 62, 64, 60],
  }),
  melody({
    id: "oh-susanna", title: "Oh! Susanna", attribution: "Stephen Foster", key: "C major",
    difficulty: "easy", bpm: 108, tonic: 60, pitches: [60, 62, 64, 67, 67, 69, 67, 64, 60, 62, 64, 64, 62, 60, 62],
  }),
  melody({
    id: "auld-lang-syne", title: "Auld Lang Syne", attribution: "Traditional Scottish", key: "F major",
    difficulty: "easy", bpm: 92, tonic: 65, pitches: [60, 65, 65, 65, 69, 67, 65, 67, 69, 65, 65, 69, 72, 74],
  }),
  melody({
    id: "deck-the-halls", title: "Deck the Halls", attribution: "Traditional Welsh", key: "C major",
    difficulty: "easy", bpm: 112, tonic: 60, pitches: [67, 65, 64, 62, 60, 62, 64, 60, 62, 64, 65, 62, 64, 62, 60, 59, 60],
  }),
  melody({
    id: "silent-night", title: "Silent Night", attribution: "Franz Xaver Gruber", key: "C major",
    difficulty: "easy", bpm: 76, tonic: 60, pitches: [67, 69, 67, 64, 67, 69, 67, 64, 74, 74, 71, 72, 72, 67],
  }),
  melody({
    id: "we-wish-you", title: "We Wish You a Merry Christmas", attribution: "Traditional English", key: "C major",
    difficulty: "easy", bpm: 112, tonic: 60, pitches: [67, 72, 72, 74, 72, 71, 69, 69, 74, 74, 76, 74, 72, 71, 67],
  }),
  melody({
    id: "la-cucaracha", title: "La Cucaracha", attribution: "Traditional Mexican", key: "C major",
    difficulty: "easy", bpm: 116, tonic: 60, pitches: [60, 60, 60, 65, 69, 60, 60, 60, 65, 69, 65, 65, 64, 64, 62, 62, 60],
  }),
  melody({
    id: "oh-my-darling", title: "Oh My Darling, Clementine", attribution: "Percy Montrose", key: "C major",
    difficulty: "easy", bpm: 104, tonic: 60, pitches: [67, 67, 67, 60, 64, 64, 64, 60, 67, 60, 64, 67, 67, 65, 64, 62],
  }),
  melody({
    id: "lightly-row", title: "Lightly Row", attribution: "Traditional German", key: "C major",
    difficulty: "easy", bpm: 104, tonic: 60, pitches: [67, 64, 64, 65, 62, 62, 60, 62, 64, 65, 67, 67, 67],
  }),
  {
    id: "minuet-in-g",
    title: "Minuet in G major",
    attribution: "Christian Petzold",
    key: "G major",
    difficulty: "medium",
    bpm: 96,
    notes: phrase([74, 67, 69, 71, 72, 74, 67, 67, 76, 72, 74, 76, 78, 79, 67, 67]),
    degrees: ["5", "1", "2", "3", "4", "5", "1", "1", "6", "4", "5", "6", "7", "1", "1", "1"],
  },
  {
    id: "sakura",
    title: "Sakura Sakura",
    attribution: "Traditional Japanese",
    key: "A minor",
    difficulty: "medium",
    bpm: 88,
    notes: phrase([69, 69, 71, 69, 69, 71, 69, 71, 72, 71, 69, 71, 69, 65]),
    degrees: ["1", "1", "2", "1", "1", "2", "1", "2", "b3", "2", "1", "2", "1", "b6"],
  },
  {
    id: "au-clair-de-la-lune",
    title: "Au Clair de la Lune",
    attribution: "Traditional French",
    key: "C major",
    difficulty: "medium",
    bpm: 94,
    notes: phrase([60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60]),
    degrees: ["1", "1", "1", "2", "3", "2", "1", "3", "2", "2", "1"],
  },
  {
    id: "go-tell-aunt-rhody",
    title: "Go Tell Aunt Rhody",
    attribution: "Traditional",
    key: "C major",
    difficulty: "medium",
    bpm: 100,
    notes: phrase([64, 64, 62, 60, 64, 64, 62, 60, 60, 60, 62, 64, 67, 67, 64, 62, 60]),
    degrees: ["3", "3", "2", "1", "3", "3", "2", "1", "1", "1", "2", "3", "5", "5", "3", "2", "1"],
  },
  melody({
    id: "greensleeves", title: "Greensleeves", attribution: "Traditional English", key: "A minor",
    difficulty: "medium", bpm: 92, tonic: 69, pitches: [71, 72, 72, 72, 74, 76, 74, 71, 67, 67, 69, 71, 72, 69, 69, 71, 72],
  }),
  melody({
    id: "drunken-sailor", title: "Drunken Sailor", attribution: "Traditional sea shanty", key: "D Dorian",
    difficulty: "medium", bpm: 112, tonic: 62, pitches: [69, 69, 69, 69, 69, 69, 62, 65, 69, 67, 67, 67, 67, 67, 67, 60, 64, 67],
  }),
  melody({
    id: "god-rest-ye", title: "God Rest Ye Merry, Gentlemen", attribution: "Traditional English", key: "E minor",
    difficulty: "medium", bpm: 104, tonic: 64, pitches: [64, 71, 71, 69, 67, 66, 64, 62, 64, 66, 67, 69, 71],
  }),
  melody({
    id: "new-world-largo", title: "New World Symphony — Largo", attribution: "Antonín Dvořák", key: "D major",
    difficulty: "medium", bpm: 80, tonic: 62, pitches: [77, 81, 81, 77, 76, 74, 76, 77, 81, 77, 76, 77, 81, 81, 77, 76, 74],
  }),
  melody({
    id: "hall-mountain-king", title: "In the Hall of the Mountain King", attribution: "Edvard Grieg", key: "B minor",
    difficulty: "medium", bpm: 104, tonic: 59, pitches: [59, 61, 62, 64, 66, 62, 66, 67, 64, 67, 66, 62, 66, 71, 70, 66, 70, 71],
  }),
  melody({
    id: "scarborough-fair", title: "Scarborough Fair", attribution: "Traditional English", key: "A Dorian",
    difficulty: "medium", bpm: 88, tonic: 69, pitches: [69, 69, 76, 76, 71, 72, 71, 69, 67, 69, 72, 74, 76, 74, 72, 71, 67, 69],
  }),
  melody({
    id: "house-rising-sun", title: "The House of the Rising Sun", attribution: "Traditional American", key: "A minor",
    difficulty: "medium", bpm: 88, tonic: 69, pitches: [69, 72, 76, 81, 80, 76, 74, 72, 69, 72, 76, 81, 79, 76, 74, 72],
  }),
  melody({
    id: "toccata-d-minor", title: "Toccata in D minor", attribution: "Johann Sebastian Bach", key: "D minor",
    difficulty: "medium", bpm: 96, tonic: 62, pitches: [74, 73, 74, 76, 77, 79, 81, 82, 81, 79, 77, 76, 74, 73, 74],
  }),
  {
    id: "maple-leaf-rag",
    title: "Maple Leaf Rag",
    attribution: "Scott Joplin",
    key: "G major",
    difficulty: "hard",
    bpm: 112,
    notes: phrase(
      [67, 74, 67, 71, 74, 67, 74, 66, 69, 74, 67, 74, 67, 71, 74, 67, 74, 66, 69, 74, 67, 70, 75, 74, 67, 70, 75, 74],
      0.5,
    ),
    degrees: [
      "1", "5", "1", "3", "5", "1", "5", "7", "2", "5", "1", "5", "1", "3", "5", "1", "5", "7",
      "2", "5", "1", "b3", "b6", "5", "1", "b3", "b6", "5",
    ],
  },
  {
    id: "bourree-in-e-minor",
    title: "Bourrée in E minor",
    attribution: "Johann Sebastian Bach",
    key: "E minor",
    difficulty: "hard",
    bpm: 108,
    notes: phrase([64, 66, 67, 66, 64, 63, 64, 66, 59, 61, 62, 64, 62, 60, 59, 57, 55, 54, 55, 57], 0.5),
    degrees: ["1", "2", "b3", "2", "1", "7", "1", "2", "5", "6", "b7", "1", "b7", "b6", "5", "4", "b3", "2", "b3", "4"],
  },
  {
    id: "easy-winners",
    title: "The Easy Winners",
    attribution: "Scott Joplin",
    key: "A♭ major",
    difficulty: "hard",
    bpm: 104,
    notes: phrase(
      [65, 66, 67, 70, 70, 75, 73, 70, 65, 66, 67, 72, 72, 70, 65, 67, 68, 63, 65, 67, 68, 69, 70, 71, 72, 71, 72, 77, 77, 75, 70, 72],
      0.5,
    ),
    degrees: [
      "6", "b7", "7", "2", "2", "5", "4", "2", "6", "b7", "7", "3", "3", "2", "6", "7", "1", "5",
      "6", "7", "1", "#1", "2", "b3", "3", "b3", "3", "6", "6", "5", "2", "3",
    ],
  },
  melody({
    id: "the-entertainer", title: "The Entertainer", attribution: "Scott Joplin", key: "C major",
    difficulty: "hard", bpm: 104, tonic: 60, beats: 0.5,
    pitches: [86, 88, 84, 81, 81, 83, 79, 74, 76, 72, 69, 69, 71, 67, 62, 64, 60, 57, 57, 59, 57, 56, 55],
  }),
  melody({
    id: "ragtime-cowboy-joe", title: "Ragtime Cowboy Joe", attribution: "Lewis F. Muir", key: "C major",
    difficulty: "hard", bpm: 108, tonic: 60, beats: 0.5,
    pitches: [67, 67, 67, 68, 69, 69, 69, 68, 67, 68, 69, 68, 69, 67, 67, 67, 68, 69, 69, 69, 67, 66, 76, 74, 74, 67],
  }),
  melody({
    id: "rosebud-march", title: "The Rose-bud March", attribution: "Scott Joplin", key: "G major",
    difficulty: "hard", bpm: 108, tonic: 67, beats: 0.5,
    pitches: [74, 74, 72, 71, 70, 69, 68, 67, 65, 65, 64, 63, 62, 63, 64, 65, 64, 63, 62],
  }),
  melody({
    id: "rondo-alla-turca", title: "Rondo alla Turca", attribution: "Wolfgang Amadeus Mozart", key: "A minor",
    difficulty: "hard", bpm: 112, tonic: 69, beats: 0.5,
    pitches: [71, 69, 68, 69, 72, 74, 72, 71, 72, 76, 77, 76, 75, 76, 83, 81, 80, 81, 83, 81, 79, 81, 84, 81, 84],
  }),
  melody({
    id: "warriors-return", title: "The Warrior’s Return", attribution: "J. Scott Skinner", key: "C major",
    difficulty: "hard", bpm: 96, tonic: 60, beats: 0.5,
    pitches: [67, 67, 64, 67, 69, 71, 72, 69, 67, 64, 62, 60, 62, 64, 65, 69, 67, 67, 64, 67, 69, 71, 72, 71, 69, 71, 72, 74, 71, 67, 62, 64, 66, 67],
  }),
  melody({
    id: "my-friend-joe", title: "My Friend Joe", attribution: "J. Scott Skinner", key: "C major",
    difficulty: "hard", bpm: 96, tonic: 60, beats: 0.5,
    pitches: [65, 64, 65, 67, 70, 69, 65, 69, 67, 65, 64, 72, 74, 62, 62, 65, 64, 65, 67, 70, 69, 65, 69, 67, 72, 71, 74, 72, 60],
  }),
];

export function pickMelody(difficulty: MelodyDifficulty, previousId?: string): Melody {
  const choices = MELODIES.filter((melody) => melody.difficulty === difficulty && melody.id !== previousId);
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return choices[random % choices.length] ?? MELODIES.find((melody) => melody.difficulty === difficulty) ?? MELODIES[0];
}
