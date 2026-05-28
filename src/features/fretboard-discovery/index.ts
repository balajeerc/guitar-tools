import { NOTES } from "../../shared/constants";
import { renderFretboard } from "./renderer";
import { MOBILE_BREAKPOINT } from "../../shared/layout";
import { setupAccordionToggle } from "../../shared/accordion";
import { loadPersisted, savePersisted } from "../../shared/persist";
import { createResetLink } from "../../shared/resetLink";

// LocalStorage keys
const STORAGE_KEY_NOTES = "fretboard-discovery-notes";
const STORAGE_KEY_STRINGS = "fretboard-discovery-strings";

// Application state
const ALL_STRINGS = [1, 2, 3, 4, 5, 6];
let selectedNotes: Set<string> = new Set(NOTES);
let selectedStrings: Set<number> = new Set([1, 2, 3, 4, 5, 6]);

/**
 * Load selections from localStorage
 */
function loadSelectionsFromStorage(): void {
  const notes = loadPersisted<string[] | null>(STORAGE_KEY_NOTES, null);
  if (notes) selectedNotes = new Set(notes);

  const strings = loadPersisted<number[] | null>(STORAGE_KEY_STRINGS, null);
  if (strings) selectedStrings = new Set(strings);
}

/**
 * Save selections to localStorage
 */
function saveSelectionsToStorage(): void {
  savePersisted(STORAGE_KEY_NOTES, [...selectedNotes]);
  savePersisted(STORAGE_KEY_STRINGS, [...selectedStrings]);
}

/**
 * Reset note and string selections to defaults (all selected)
 */
function resetSelections(): void {
  // Mutate the existing Sets in place so toggle-all handlers keep their refs
  selectedNotes.clear();
  for (const note of NOTES) selectedNotes.add(note);
  selectedStrings.clear();
  for (const stringNumber of ALL_STRINGS) selectedStrings.add(stringNumber);

  const controls = document.getElementById("discovery-controls");
  if (controls) {
    for (const cb of controls.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    )) {
      cb.checked = true;
    }
    for (const btn of controls.querySelectorAll<HTMLButtonElement>(
      ".select-all-btn",
    )) {
      btn.textContent = "Deselect All";
    }
  }

  saveSelectionsToStorage();
  updateDisplay();
}

/**
 * Generate summary text for the accordion toggle
 */
function getControlsSummary(): string {
  const noteCount = selectedNotes.size;
  const stringCount = selectedStrings.size;
  const notesPart =
    noteCount === NOTES.length ? "All notes" : `${noteCount} notes`;
  const stringsPart =
    stringCount === ALL_STRINGS.length
      ? "All strings"
      : `${stringCount} strings`;
  return `${notesPart} · ${stringsPart}`;
}

/**
 * Update the accordion summary text
 */
function updateControlsSummary(): void {
  const summary = document.getElementById("discoveryControlsSummary");
  if (summary) {
    summary.textContent = getControlsSummary();
  }
}

/**
 * Update display based on current selections
 */
function updateDisplay(): void {
  renderFretboard(selectedNotes, selectedStrings);
  updateControlsSummary();
}

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

  // Create the page structure with accordion wrapper
  container.innerHTML = `
    <div class="controls-wrapper">
      <button class="controls-accordion-toggle" id="discoveryAccordionToggle">
        <span class="controls-summary" id="discoveryControlsSummary">${getControlsSummary()}</span>
        <span class="controls-accordion-arrow">&#9662;</span>
      </button>
      <div class="controls" id="discovery-controls">
        <!-- Controls will be inserted here -->
      </div>
    </div>

    <div class="fretboard-discovery-board">
      <div class="fretboard-container">
        <div class="fretboard" id="fretboard-discovery">
          <!-- Dynamically populated -->
        </div>
        <div class="fret-numbers" id="fretNumbers-discovery">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  // Add controls
  const controlsContainer = document.getElementById("discovery-controls");
  if (controlsContainer) {
    controlsContainer.appendChild(createNoteControls());
    controlsContainer.appendChild(createStringControls());
    controlsContainer.appendChild(createResetLink(resetSelections));
  }

  // Set up accordion toggle
  setupAccordionToggle("discoveryAccordionToggle");

  // Re-render when crossing mobile breakpoint
  window
    .matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    .addEventListener("change", () => updateDisplay());

  // Initial render
  updateDisplay();
}
