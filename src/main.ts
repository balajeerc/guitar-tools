import { initInstallPrompt } from './pwa/installPrompt';
import { registerServiceWorker } from './pwa/serviceWorkerRegistration';
import { initRouter } from './router';
import { initAudioInputControls } from './shared/audioInput';
import { initFretboardSound } from './shared/fretboardSound';
import { initSidebar } from './shared/sidebar';
import { initTheme } from './shared/theme';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initFretboardSound();
  initRouter();
  initAudioInputControls();
  initInstallPrompt();
});

registerServiceWorker();
