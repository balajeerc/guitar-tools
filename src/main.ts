import { initRouter } from "./router";
import { registerServiceWorker } from "./pwa/serviceWorkerRegistration";
import { initInstallPrompt } from "./pwa/installPrompt";
import { initSidebar } from "./shared/sidebar";
import { initTheme } from "./shared/theme";
import { initFretboardSound } from "./shared/fretboardSound";
import { initAudioInputControls } from "./shared/audioInput";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebar();
  initFretboardSound();
  initRouter();
  initAudioInputControls();
  initInstallPrompt();
});

registerServiceWorker();
