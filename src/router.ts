import { initScalesFeature } from "./features/scales";
import { initFretWalkFeature } from "./features/fret-walk";
import { initFretboardDiscoveryFeature } from "./features/fretboard-discovery";
import { initCircleOfFifthsFeature } from "./features/circle-of-fifths";
import { initListenerFeature } from "./features/listener";
import { initTunerFeature } from "./features/tuner";
import { initMetronomeFeature } from "./features/metronome";
import { initBeatsFeature } from "./features/beats";
import { initTriadsFeature } from "./features/triads";
import { initMelodiesFeature } from "./features/melodies";
import { initPlayByEarFeature } from "./features/play-by-ear";

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
    triads: () => {
      showPage("triads-page");
    },
    "fret-walk": () => {
      showPage("fret-walk-page");
    },
    "fretboard-discovery": () => {
      showPage("fretboard-discovery-page");
    },
    "circle-of-fifths": () => {
      showPage("circle-of-fifths-page");
    },
    melodies: () => {
      showPage("melodies-page");
    },
    "play-by-ear": () => {
      showPage("play-by-ear-page");
    },
    listener: () => {
      showPage("listener-page");
    },
    tuner: () => {
      showPage("tuner-page");
    },
    metronome: () => {
      showPage("metronome-page");
    },
    beats: () => {
      showPage("beats-page");
    },
  };

  function handleRoute(): void {
    const hash = window.location.hash.slice(1) || "scales";
    const route = routes[hash.split("/")[0]];
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
  initTriadsFeature();
  initFretWalkFeature();
  initFretboardDiscoveryFeature();
  initCircleOfFifthsFeature();
  initMelodiesFeature();
  initPlayByEarFeature();
  initListenerFeature();
  initTunerFeature();
  initMetronomeFeature();
  initBeatsFeature();

  // Handle initial route
  handleRoute();
}
