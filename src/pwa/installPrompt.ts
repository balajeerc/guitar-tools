interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
let deferredPrompt: BeforeInstallPromptEvent | null = null;

function isDismissed(): boolean {
  return localStorage.getItem(DISMISS_KEY) === "true";
}

function removeBanner(): void {
  const banner = document.querySelector("#pwa-install-banner");
  if (banner) banner.remove();
  deferredPrompt = null;
}

function dismissBanner(): void {
  localStorage.setItem(DISMISS_KEY, "true");
  removeBanner();
}

async function handleInstallClick(): Promise<void> {
  if (!deferredPrompt) return;

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    dismissBanner();
  }

  deferredPrompt = null;
}

function createBanner(): HTMLElement {
  const banner = document.createElement("div");
  banner.id = "pwa-install-banner";
  banner.className = "pwa-install-banner";

  const text = document.createElement("span");
  text.className = "pwa-install-text";
  text.textContent = "Install this app for offline use";

  const actions = document.createElement("div");
  actions.className = "pwa-install-actions";

  const installBtn = document.createElement("button");
  installBtn.className = "pwa-install-btn";
  installBtn.textContent = "Install";
  installBtn.addEventListener("click", () => {
    void handleInstallClick();
  });

  const dismissBtn = document.createElement("button");
  dismissBtn.className = "pwa-dismiss-btn";
  dismissBtn.textContent = "\u2715";
  dismissBtn.setAttribute("aria-label", "Dismiss install prompt");
  dismissBtn.addEventListener("click", dismissBanner);

  actions.append(installBtn, dismissBtn);
  banner.append(text, actions);
  return banner;
}

function showBanner(): void {
  if (document.querySelector("#pwa-install-banner")) return;
  document.body.append(createBanner());
}

export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;

    if (!isDismissed()) {
      showBanner();
    }
  });

  window.addEventListener("appinstalled", removeBanner);
}
