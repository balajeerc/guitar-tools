import { initRouter } from "./router";
import { registerServiceWorker } from "./pwa/serviceWorkerRegistration";
import { initInstallPrompt } from "./pwa/installPrompt";

document.addEventListener("DOMContentLoaded", () => {
  initRouter();
  initInstallPrompt();
});

registerServiceWorker();
