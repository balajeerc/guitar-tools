import { initBeatsFeature } from './features/beats';
import { initCircleOfFifthsFeature } from './features/circle-of-fifths';
import { initEarTrainerFeature } from './features/ear-trainer';
import { initFretWalkFeature } from './features/fret-walk';
import { initFretboardDiscoveryFeature } from './features/fretboard-discovery';
import { initListenerFeature } from './features/listener';
import { initMelodiesFeature } from './features/melodies';
import { initMetronomeFeature } from './features/metronome';
import { initPlayByEarFeature } from './features/play-by-ear';
import { initScalesFeature } from './features/scales';
import { initTriadsFeature } from './features/triads';
import { initTunerFeature } from './features/tuner';
import { requiredAt } from './shared/requiredAt';

function showPage(pageId: string): void {
  const pages = document.querySelectorAll('.page');
  for (const page of pages) {
    if (page.id === pageId) {
      (page as HTMLElement).style.display = 'block';
    } else {
      (page as HTMLElement).style.display = 'none';
    }
  }

  // Update active nav link
  const links = document.querySelectorAll('.nav-link');
  for (const link of links) {
    if (link.getAttribute('href') === `#${pageId.replace('-page', '')}`) {
      link.classList.add('active');
    } else if (link.getAttribute('href') === '#' && pageId === 'scales-page') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  }
}

export function initRouter(): void {
  const routes: Record<string, () => void> = {
    scales: () => {
      showPage('scales-page');
    },
    triads: () => {
      showPage('triads-page');
    },
    'fret-walk': () => {
      showPage('fret-walk-page');
    },
    'fretboard-discovery': () => {
      showPage('fretboard-discovery-page');
    },
    'circle-of-fifths': () => {
      showPage('circle-of-fifths-page');
    },
    melodies: () => {
      showPage('melodies-page');
    },
    'ear-trainer': () => {
      showPage('ear-trainer-page');
    },
    'play-by-ear': () => {
      showPage('play-by-ear-page');
    },
    listener: () => {
      showPage('listener-page');
    },
    tuner: () => {
      showPage('tuner-page');
    },
    metronome: () => {
      showPage('metronome-page');
    },
    beats: () => {
      showPage('beats-page');
    },
  };

  function handleRoute(): void {
    const hash = window.location.hash.slice(1) || 'scales';
    const route = routes[requiredAt(hash.split('/'), 0)];
    if (route) {
      route();
    } else {
      // Default to scales
      showPage('scales-page');
    }
  }

  window.addEventListener('hashchange', handleRoute);

  // Initialize features
  initScalesFeature();
  initTriadsFeature();
  initFretWalkFeature();
  initFretboardDiscoveryFeature();
  initCircleOfFifthsFeature();
  initMelodiesFeature();
  initEarTrainerFeature();
  initPlayByEarFeature();
  initListenerFeature();
  initTunerFeature();
  initMetronomeFeature();
  initBeatsFeature();

  // Handle initial route
  handleRoute();
}
