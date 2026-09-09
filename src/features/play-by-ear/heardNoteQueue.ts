export interface HeardNoteQueue {
  add: (midi: number) => void;
  clear: () => void;
  dispose: () => void;
  setAutoClear: (enabled: boolean) => void;
  values: () => readonly number[];
}

export function createHeardNoteQueue(
  capacity: number,
  clearDelayMs: number,
  initiallyAutoClear: boolean,
  onAutoClear: () => void,
): HeardNoteQueue {
  const notes: number[] = [];
  let autoClear = initiallyAutoClear;
  let timeoutId: number | null = null;

  function cancelTimer(): void {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    timeoutId = null;
  }

  function clear(): void {
    cancelTimer();
    notes.length = 0;
  }

  function scheduleClear(): void {
    cancelTimer();
    if (!autoClear || notes.length === 0) return;
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      notes.length = 0;
      onAutoClear();
    }, clearDelayMs);
  }

  function add(midi: number): void {
    notes.push(midi);
    if (notes.length > capacity) notes.shift();
    scheduleClear();
  }

  function setAutoClear(enabled: boolean): void {
    autoClear = enabled;
    scheduleClear();
  }

  return { add, clear, dispose: cancelTimer, setAutoClear, values: () => [...notes] };
}
