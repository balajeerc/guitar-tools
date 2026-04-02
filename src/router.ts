import { initScalesFeature } from "./features/scales";
import { initFretboardDiscoveryFeature } from "./features/fretboard-discovery";
import { initNoteDetection } from "./features/note-detection";

function showPage(pageId: string): void {
  const pages = document.querySelectorAll(".page");
  for (const page of pages) {
    if (page.id === pageId) {
      (page as HTMLElement).style.display = "block";
    } else {
      (page as HTMLElement).style.display = "none";
    }
  }

  // Update active nav link
  const links = document.querySelectorAll(".nav-link");
  for (const link of links) {
    if (link.getAttribute("href") === `#${pageId.replace("-page", "")}`) {
      link.classList.add("active");
    } else if (link.getAttribute("href") === "#" && pageId === "scales-page") {
      // Handle default case if needed, or just rely on explicit hashes
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  }
}

export function initRouter(): void {
  const routes: Record<string, () => void> = {
    scales: () => {
      showPage("scales-page");
    },
    "fretboard-discovery": () => {
      showPage("fretboard-discovery-page");
    },
  };

  function handleRoute(): void {
    const hash = window.location.hash.slice(1) || "scales";
    const route = routes[hash];
    if (route) {
      route();
    } else {
      // Default to scales
      routes["scales"]();
    }
  }

  window.addEventListener("hashchange", handleRoute);

  // Initialize features
  initScalesFeature();
  initFretboardDiscoveryFeature();
  initNoteDetection();

  // Handle initial route
  handleRoute();
}
