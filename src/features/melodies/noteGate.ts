import type { DetectedNote } from "../note-detection/noteMapper";

const STABLE_NOTE_MS = 110;

export interface NoteGate {
  update: (note: DetectedNote | null, now: number) => DetectedNote | null;
  reset: () => void;
}

/** Turns frame-by-frame pitch readings into one event per deliberately played note. */
export function createNoteGate(): NoteGate {
  let candidate: DetectedNote | null = null;
  let candidateSince = 0;
  let emittedMidi: number | null = null;

  function reset(): void {
    candidate = null;
    emittedMidi = null;
  }

  function update(note: DetectedNote | null, now: number): DetectedNote | null {
    if (!note) {
      reset();
      return null;
    }
    if (candidate?.midiNote !== note.midiNote) {
      candidate = note;
      candidateSince = now;
      emittedMidi = null;
      return null;
    }
    if (emittedMidi === note.midiNote || now - candidateSince < STABLE_NOTE_MS) return null;
    emittedMidi = note.midiNote;
    return note;
  }

  return { update, reset };
}
