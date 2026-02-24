import { NOTES } from "../../shared/constants";
import { renderFretboard } from "./renderer";

// LocalStorage keys
const STORAGE_KEY_NOTES = "fretboard-discovery-notes";
const STORAGE_KEY_STRINGS = "fretboard-discovery-strings";

// Application state
let selectedNotes: Set<string> = new Set(NOTES);
let selectedStrings: Set<number> = new Set([1, 2, 3, 4, 5, 6]);

/**
 * Load selections from localStorage
 */
function loadSelectionsFromStorage(): void {
  try {
    const storedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    if (storedNotes) {
      const parsed = JSON.parse(storedNotes) as string[];
      selectedNotes = new Set(parsed);
    }

    const storedStrings = localStorage.getItem(STORAGE_KEY_STRINGS);
    if (storedStrings) {
      const parsed = JSON.parse(storedStrings) as number[];
      selectedStrings = new Set(parsed);
    }
  } catch (error) {
    console.error("Error loading selections from localStorage:", error);
  }
}

/**
 * Save selections to localStorage
 */
function saveSelectionsToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify([...selectedNotes]));
    localStorage.setItem(
      STORAGE_KEY_STRINGS,
      JSON.stringify([...selectedStrings]),
    );
  } catch (error) {
    console.error("Error saving selections to localStorage:", error);
  }
}

/**
 * Update display based on current selections
 */
function updateDisplay(): void {
  renderFretboard(selectedNotes, selectedStrings);
}

const ALL_STRINGS = [1, 2, 3, 4, 5, 6];

/**
 * Create a toggle-all button for a checkbox group
 */
function createToggleAllButton<T>(
  allItems: T[],
  selectedItems: Set<T>,
  checkboxGroup: HTMLElement,
): { button: HTMLButtonElement; updateLabel: () => void } {
  const button = document.createElement("button");
  button.className = "select-all-btn";

  function updateLabel(): void {
    const allSelected = allItems.every((item) => selectedItems.has(item));
    button.textContent = allSelected ? "Deselect All" : "Select All";
  }

  updateLabel();

  button.addEventListener("click", () => {
    const allSelected = allItems.every((item) => selectedItems.has(item));
    const checkboxes = checkboxGroup.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );

    if (allSelected) {
      selectedItems.clear();
      for (const cb of checkboxes) {
        cb.checked = false;
      }
    } else {
      for (const item of allItems) {
        selectedItems.add(item);
      }
      for (const cb of checkboxes) {
        cb.checked = true;
      }
    }

    saveSelectionsToStorage();
    updateDisplay();
    updateLabel();
  });

  return { button, updateLabel };
}

/**
 * Create multi-select control for notes
 */
function createNoteControls(): HTMLElement {
  const container = document.createElement("div");
  container.className = "control-group";

  const label = document.createElement("span");
  label.className = "control-label";
  label.textContent = "Notes:";
  container.appendChild(label);

  const checkboxGroup = document.createElement("div");
  checkboxGroup.className = "checkbox-group";

  const { button: toggleBtn, updateLabel } = createToggleAllButton(
    [...NOTES],
    selectedNotes,
    checkboxGroup,
  );
  container.appendChild(toggleBtn);

  for (const note of NOTES) {
    const checkboxWrapper = document.createElement("label");
    checkboxWrapper.className = "checkbox-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = note;
    checkbox.checked = selectedNotes.has(note);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedNotes.add(note);
      } else {
        selectedNotes.delete(note);
      }
      saveSelectionsToStorage();
      updateDisplay();
      updateLabel();
    });

    const labelText = document.createElement("span");
    labelText.textContent = note;

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(labelText);
    checkboxGroup.appendChild(checkboxWrapper);
  }

  container.appendChild(checkboxGroup);
  return container;
}

/**
 * Create multi-select control for strings
 */
function createStringControls(): HTMLElement {
  const container = document.createElement("div");
  container.className = "control-group";

  const label = document.createElement("span");
  label.className = "control-label";
  label.textContent = "Strings:";
  container.appendChild(label);

  const checkboxGroup = document.createElement("div");
  checkboxGroup.className = "checkbox-group";

  const { button: toggleBtn, updateLabel } = createToggleAllButton(
    ALL_STRINGS,
    selectedStrings,
    checkboxGroup,
  );
  container.appendChild(toggleBtn);

  for (let stringNumber = 1; stringNumber <= 6; stringNumber++) {
    const checkboxWrapper = document.createElement("label");
    checkboxWrapper.className = "checkbox-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = stringNumber.toString();
    checkbox.checked = selectedStrings.has(stringNumber);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedStrings.add(stringNumber);
      } else {
        selectedStrings.delete(stringNumber);
      }
      saveSelectionsToStorage();
      updateDisplay();
      updateLabel();
    });

    const labelText = document.createElement("span");
    labelText.textContent = stringNumber.toString();

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(labelText);
    checkboxGroup.appendChild(checkboxWrapper);
  }

  container.appendChild(checkboxGroup);
  return container;
}

/**
 * Initialize the Fretboard Discovery feature
 */
export function initFretboardDiscoveryFeature(): void {
  const container = document.getElementById("fretboard-discovery-page");
  if (!container) return;

  // Load saved selections from localStorage
  loadSelectionsFromStorage();

  // Create the page structure
  container.innerHTML = `
    <div class="controls" id="discovery-controls">
      <!-- Controls will be inserted here -->
    </div>

    <div class="fretboard-container">
      <div class="fretboard" id="fretboard-discovery">
        <!-- Dynamically populated -->
      </div>
      <div class="fret-numbers" id="fretNumbers-discovery">
        <!-- Dynamically populated -->
      </div>
    </div>
  `;

  // Add controls
  const controlsContainer = document.getElementById("discovery-controls");
  if (controlsContainer) {
    controlsContainer.appendChild(createNoteControls());
    controlsContainer.appendChild(createStringControls());
  }

  // Initial render
  updateDisplay();
}
