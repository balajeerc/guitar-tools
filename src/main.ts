import { initRouter } from "./router";
import { registerServiceWorker } from "./pwa/serviceWorkerRegistration";
import { initInstallPrompt } from "./pwa/installPrompt";
import { initSidebar } from "./shared/sidebar";
import { initTheme } from "./shared/theme";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebar();
  initRouter();
  initInstallPrompt();
});

registerServiceWorker();
