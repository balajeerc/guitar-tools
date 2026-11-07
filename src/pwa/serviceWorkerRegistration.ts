/**
 * Tear down any service worker a previous dev session installed, along with its
 * caches. sw.js serves assets cache-first and never revalidates, which in dev
 * pins each module and stylesheet to whatever revision it was first fetched at.
 */
async function unregisterInDev(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
}

async function registerInProduction(): Promise<void> {
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    void unregisterInDev();
    return;
  }

  window.addEventListener('load', () => void registerInProduction());
}
