import { initRouter } from "./router";
import { registerServiceWorker } from "./pwa/serviceWorkerRegistration";
import { initInstallPrompt } from "./pwa/installPrompt";
import { initTheme } from "./shared/theme";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initRouter();
  initInstallPrompt();
});

registerServiceWorker();
