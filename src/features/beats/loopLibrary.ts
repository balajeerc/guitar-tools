import {
  deleteBeatLoop,
  loadSavedLoops,
  saveBeatLoop,
  type BeatLoopState,
  type SavedBeatLoop,
} from "./loops";

interface LoopLibraryHandlers {
  getCurrentState: () => BeatLoopState;
  onLoad: (loop: SavedBeatLoop) => void;
  initialSelectedId?: string;
}

interface LoopLibraryElements {
  name: HTMLInputElement;
  select: HTMLSelectElement;
  save: HTMLButtonElement;
  load: HTMLButtonElement;
  remove: HTMLButtonElement;
  status: HTMLElement;
}

function getElements(): LoopLibraryElements | null {
  const name = document.getElementById("beatsLoopName") as HTMLInputElement | null;
  const select = document.getElementById("beatsLoopSelect") as HTMLSelectElement | null;
  const save = document.getElementById("beatsLoopSave") as HTMLButtonElement | null;
  const load = document.getElementById("beatsLoopLoad") as HTMLButtonElement | null;
  const remove = document.getElementById("beatsLoopDelete") as HTMLButtonElement | null;
  const status = document.getElementById("beatsLoopStatus");
  if (!name || !select || !save || !load || !remove || !status) return null;
  return { name, select, save, load, remove, status };
}

function findLoop(loops: SavedBeatLoop[], id: string): SavedBeatLoop | undefined {
  return loops.find((loop) => loop.id === id);
}

function renderOptions(
  elements: LoopLibraryElements,
  loops: SavedBeatLoop[],
  selectedId: string,
): void {
  const placeholder = new Option("Choose a saved loop", "");
  elements.select.replaceChildren(placeholder);
  for (const loop of loops) {
    elements.select.add(new Option(loop.name, loop.id));
  }
  elements.select.value = selectedId;
  const hasSelection = findLoop(loops, selectedId) !== undefined;
  elements.load.disabled = !hasSelection;
  elements.remove.disabled = !hasSelection;
}

function setStatus(elements: LoopLibraryElements, message: string): void {
  elements.status.textContent = message;
}

export function setupLoopLibrary(handlers: LoopLibraryHandlers): void {
  const foundElements = getElements();
  if (!foundElements) return;
  const elements = foundElements;
  let loops = loadSavedLoops();
  let selectedId = handlers.initialSelectedId ?? "";
  const initialSelection = findLoop(loops, selectedId);
  if (initialSelection) elements.name.value = initialSelection.name;
  renderOptions(elements, loops, selectedId);

  function saveCurrentLoop(): void {
    const name = elements.name.value.trim();
    if (name.length === 0) {
      setStatus(elements, "Enter a loop name first.");
      elements.name.focus();
      return;
    }
    const result = saveBeatLoop(loops, name, handlers.getCurrentState());
    loops = result.loops;
    selectedId = result.saved.id;
    elements.name.value = result.saved.name;
    renderOptions(elements, loops, selectedId);
    setStatus(elements, result.overwritten ? "Loop updated." : "Loop saved.");
  }

  elements.select.addEventListener("change", () => {
    selectedId = elements.select.value;
    const selected = findLoop(loops, selectedId);
    if (selected) elements.name.value = selected.name;
    renderOptions(elements, loops, selectedId);
    setStatus(elements, "");
  });
  elements.save.addEventListener("click", saveCurrentLoop);
  elements.name.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveCurrentLoop();
  });
  elements.load.addEventListener("click", () => {
    const selected = findLoop(loops, selectedId);
    if (selected) handlers.onLoad(selected);
  });
  elements.remove.addEventListener("click", () => {
    const selected = findLoop(loops, selectedId);
    if (!selected || !window.confirm(`Delete the loop “${selected.name}”?`)) return;
    loops = deleteBeatLoop(loops, selected.id);
    selectedId = "";
    elements.name.value = "";
    renderOptions(elements, loops, selectedId);
    setStatus(elements, "Loop deleted.");
  });
}
