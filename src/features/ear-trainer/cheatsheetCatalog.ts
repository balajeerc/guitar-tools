interface SongReference {
  cue: string;
  title: string;
}

export interface CheatsheetInterval {
  degree: string;
  name: string;
  references: readonly SongReference[];
  semitones: number;
  symbol: string;
}

// Ascending references checked against EarMaster's interval song chart:
// https://www.earmaster.com/products/free-tools/interval-song-chart-generator.html
// Cues describe the relevant passage; previews transpose every jump to C4.
export const CHEATSHEET_INTERVALS: readonly CheatsheetInterval[] = [
  {
    semitones: 1,
    name: 'Minor 2nd',
    symbol: 'm2',
    degree: '♭2',
    references: [
      { title: 'Jaws Theme', cue: 'The two-note shark motif' },
      { title: 'The Pink Panther', cue: 'The rising half step at the start of the theme' },
      { title: 'White Christmas', cue: 'The first rising step of the vocal melody' },
      { title: 'Isn’t She Lovely', cue: 'The first upward step in the vocal phrase' },
      { title: 'Once Upon a December', cue: 'The opening half step of the melody' },
    ],
  },
  {
    semitones: 2,
    name: 'Major 2nd',
    symbol: 'M2',
    degree: '2',
    references: [
      { title: 'Happy Birthday', cue: 'The upward step after the repeated opening note' },
      { title: 'Frère Jacques', cue: 'The first two notes of the melody' },
      { title: 'Silent Night', cue: 'The first two notes of the melody' },
      { title: 'Rudolph the Red-Nosed Reindeer', cue: 'The first upward step of the melody' },
      { title: 'Do-Re-Mi', cue: 'The first step in the ascending solfège scale' },
    ],
  },
  {
    semitones: 3,
    name: 'Minor 3rd',
    symbol: 'm3',
    degree: '♭3',
    references: [
      { title: 'Seven Nation Army', cue: 'The repeated opening riff note to the next higher note' },
      { title: 'Greensleeves', cue: 'The first two notes of the melody' },
      { title: 'Smoke on the Water', cue: 'The first upward jump in the guitar riff' },
      { title: 'O Canada', cue: 'The first two notes of the anthem' },
      { title: 'Brahms’ Lullaby', cue: 'The upward leap after the repeated opening note' },
    ],
  },
  {
    semitones: 4,
    name: 'Major 3rd',
    symbol: 'M3',
    degree: '3',
    references: [
      { title: 'When the Saints Go Marching In', cue: 'The first two notes of the melody' },
      { title: 'Kumbaya', cue: 'The first two notes of the melody' },
      { title: 'Morning Has Broken', cue: 'The first two notes of the melody' },
      { title: 'Michael Row the Boat Ashore', cue: 'The first two notes of the melody' },
      { title: 'Ob-La-Di, Ob-La-Da', cue: 'The opening upward leap in the vocal melody' },
    ],
  },
  {
    semitones: 5,
    name: 'Perfect 4th',
    symbol: 'P4',
    degree: '4',
    references: [
      { title: 'Here Comes the Bride', cue: 'The first two notes of the bridal melody' },
      { title: 'Amazing Grace', cue: 'The first two notes of the melody' },
      { title: 'Hedwig’s Theme — Harry Potter', cue: 'The first two notes of the celesta melody' },
      { title: 'We Wish You a Merry Christmas', cue: 'The first two notes of the melody' },
      { title: 'Love Me Tender', cue: 'The first two notes of the vocal melody' },
    ],
  },
  {
    semitones: 6,
    name: 'Tritone',
    symbol: 'A4 / d5',
    degree: '♯4 / ♭5',
    references: [
      { title: 'The Simpsons Theme', cue: 'The opening leap in the sung title' },
      { title: 'Maria — West Side Story', cue: 'The first two notes of the name in the melody' },
      { title: 'Juicebox — The Strokes', cue: 'The upward leap in the opening bass riff' },
      { title: 'Cool — West Side Story', cue: 'The tritone leap in the vocal melody' },
      { title: 'Isotope — Joe Henderson', cue: 'The opening leap of the jazz head' },
    ],
  },
  {
    semitones: 7,
    name: 'Perfect 5th',
    symbol: 'P5',
    degree: '5',
    references: [
      {
        title: 'Twinkle, Twinkle, Little Star',
        cue: 'The leap between the two repeated-note pairs',
      },
      { title: 'Star Wars Main Theme', cue: 'The pickup notes to the first high note' },
      { title: 'Baa, Baa, Black Sheep', cue: 'The first upward leap of the melody' },
      { title: 'Scarborough Fair', cue: 'The first two notes of the melody' },
      { title: 'Can’t Help Falling in Love', cue: 'The first two notes of the vocal melody' },
    ],
  },
  {
    semitones: 8,
    name: 'Minor 6th',
    symbol: 'm6',
    degree: '♭6',
    references: [
      {
        title: 'The Entertainer — Scott Joplin',
        cue: 'The low repeated note to the high note in the main theme',
      },
      { title: 'In My Life — The Beatles', cue: 'The first two notes of the vocal melody' },
      { title: 'Go Down, Moses', cue: 'The first upward leap of the melody' },
      { title: 'We Are Young — fun.', cue: 'The upward leap at the start of the chorus' },
      { title: 'Black Orpheus', cue: 'The opening upward leap of the theme' },
    ],
  },
  {
    semitones: 9,
    name: 'Major 6th',
    symbol: 'M6',
    degree: '6',
    references: [
      {
        title: 'Jingle Bells',
        cue: 'The first two notes of the verse, before the familiar chorus',
      },
      { title: 'My Bonnie Lies over the Ocean', cue: 'The first two notes of the melody' },
      { title: 'My Way — Frank Sinatra', cue: 'The opening upward leap of the vocal melody' },
      { title: 'Princess Leia’s Theme', cue: 'The first two notes of the main melody' },
      { title: 'Nocturne Op. 9 No. 2 — Chopin', cue: 'The pickup to the first high melody note' },
    ],
  },
  {
    semitones: 10,
    name: 'Minor 7th',
    symbol: 'm7',
    degree: '♭7',
    references: [
      { title: 'Star Trek — Original Series', cue: 'The opening leap of the main vocal theme' },
      { title: 'Somewhere — West Side Story', cue: 'The first two notes of the vocal melody' },
      { title: 'The Winner Takes It All', cue: 'The opening leap of the chorus melody' },
      { title: 'Pure Imagination', cue: 'The first to third notes of the opening vocal phrase' },
      { title: 'Chameleon — Herbie Hancock', cue: 'The upward leap in the bass riff' },
    ],
  },
  {
    semitones: 11,
    name: 'Major 7th',
    symbol: 'M7',
    degree: '7',
    references: [
      { title: 'Over the Rainbow', cue: 'The first to third notes; skip the high octave note' },
      { title: 'Take on Me — a-ha', cue: 'The upward leap in the chorus title phrase' },
      { title: 'Bali Ha’i — South Pacific', cue: 'The first to third notes of the title phrase' },
      { title: 'Superman Theme', cue: 'The wide upward leap in the main theme' },
      { title: 'Fantasy Island Theme', cue: 'The upward major seventh in the main melody' },
    ],
  },
  {
    semitones: 12,
    name: 'Octave',
    symbol: 'P8',
    degree: '1′',
    references: [
      { title: 'Over the Rainbow', cue: 'The first two notes of the vocal melody' },
      { title: 'Singin’ in the Rain', cue: 'The first upward octave leap of the vocal melody' },
      { title: 'The Christmas Song', cue: 'The first two notes of the vocal melody' },
      { title: 'Let It Snow', cue: 'The upward leap at the start of the verse' },
      { title: 'Bali Ha’i — South Pacific', cue: 'The first two notes of the title phrase' },
    ],
  },
];
