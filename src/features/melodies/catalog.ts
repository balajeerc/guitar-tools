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
];

export function pickMelody(difficulty: MelodyDifficulty, previousId?: string): Melody {
  const choices = MELODIES.filter((melody) => melody.difficulty === difficulty && melody.id !== previousId);
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return choices[random % choices.length] ?? MELODIES.find((melody) => melody.difficulty === difficulty) ?? MELODIES[0];
}
