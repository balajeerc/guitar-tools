// Theme management: dark/light mode toggle with localStorage persistence

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const SUN_ICON = `<svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"></circle>
  <line x1="12" y1="1" x2="12" y2="3"></line>
  <line x1="12" y1="21" x2="12" y2="23"></line>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
  <line x1="1" y1="12" x2="3" y2="12"></line>
  <line x1="21" y1="12" x2="23" y2="12"></line>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
</svg>`;

const MOON_ICON = `<svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
</svg>`;

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(stored: Theme | null, system: Theme): Theme {
  return stored ?? system;
}

function updateMetaThemeColor(theme: Theme): void {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) {
    meta.content = theme === "dark" ? "#1a1a2e" : "#667eea";
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset["theme"] = theme;
  updateMetaThemeColor(theme);
}

function toggleTheme(): void {
  const current = document.documentElement.dataset["theme"] as Theme;
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
}

export function createThemeToggleButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "theme-toggle";
  button.setAttribute("aria-label", "Toggle theme");
  button.innerHTML = SUN_ICON + MOON_ICON;
  button.addEventListener("click", toggleTheme);
  return button;
}

export function initTheme(): void {
  const theme = resolveTheme(getStoredTheme(), getSystemTheme());
  applyTheme(theme);

  const navContainer = document.querySelector(".nav-container");
  if (navContainer) {
    navContainer.appendChild(createThemeToggleButton());
  }

  // Follow system preference changes when no stored preference
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (getStoredTheme() === null) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
}
