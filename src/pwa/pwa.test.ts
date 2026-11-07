import { describe, expect, it, vi } from 'vitest';

import { click, element, settle } from '../__fixtures__/browser';

import { initInstallPrompt } from './installPrompt';
import { registerServiceWorker } from './serviceWorkerRegistration';

function installEvent(outcome: 'accepted' | 'dismissed') {
  const prompt = vi.fn(() => {
    return Promise.resolve();
  });
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  window.dispatchEvent(event);
  return { event, prompt };
}

describe('progressive web app lifecycle', () => {
  it('offers installation on mobile, remembers dismissal and avoids duplicate banners', async () => {
    initInstallPrompt();
    installEvent('accepted');
    expect(document.querySelector('#pwa-install-banner')).toBeNull();
    Object.defineProperty(window.matchMedia('(max-width: 1024px)'), 'matches', { value: true });
    const { event, prompt } = installEvent('accepted');
    expect(event.defaultPrevented).toBe(true);
    expect(element('.pwa-install-text').textContent).toBe('Install this app for offline use');
    installEvent('accepted');
    expect(document.querySelectorAll('#pwa-install-banner')).toHaveLength(1);
    click('.pwa-install-btn');
    await settle();
    expect(prompt).not.toHaveBeenCalled();
    expect(localStorage.getItem('pwa-install-dismissed')).toBe('true');
    expect(document.querySelector('#pwa-install-banner')).toBeNull();
    installEvent('accepted');
    expect(document.querySelector('#pwa-install-banner')).toBeNull();
  });
  it('keeps the banner after a rejected install choice and allows explicit dismissal', async () => {
    initInstallPrompt();
    Object.defineProperty(window.matchMedia('(max-width: 1024px)'), 'matches', { value: true });
    const { prompt } = installEvent('dismissed');
    click('.pwa-install-btn');
    await settle();
    expect(prompt).toHaveBeenCalledOnce();
    expect(document.querySelector('#pwa-install-banner')).not.toBeNull();
    click('.pwa-install-btn');
    await settle();
    expect(prompt).toHaveBeenCalledOnce();
    click('.pwa-dismiss-btn');
    expect(localStorage.getItem('pwa-install-dismissed')).toBe('true');
    localStorage.clear();
    installEvent('dismissed');
    window.dispatchEvent(new Event('appinstalled'));
    expect(document.querySelector('#pwa-install-banner')).toBeNull();
  });
  it('removes old service workers and caches in development', async () => {
    const unregister = vi.fn(() => Promise.resolve(true));
    const getRegistrations = vi.fn(() => Promise.resolve([{ unregister }]));
    const remove = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations } });
    vi.stubGlobal('caches', { keys: () => Promise.resolve(['old-cache']), delete: remove });
    vi.stubEnv('DEV', true);
    registerServiceWorker();
    await settle();
    expect(getRegistrations).toHaveBeenCalledOnce();
    expect(unregister).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith('old-cache');
    vi.unstubAllEnvs();
  });
  it('registers production workers on load and reports failures', async () => {
    const register = vi.fn(() => {
      return Promise.resolve();
    });
    const error = vi.spyOn(console, 'error').mockImplementation(vi.fn<() => void>());
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    vi.stubEnv('DEV', false);
    vi.stubEnv('BASE_URL', '/guitar-tools/');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    await settle();
    expect(register).toHaveBeenCalledWith('/guitar-tools/sw.js');
    register.mockRejectedValueOnce(new Error('offline'));
    window.dispatchEvent(new Event('load'));
    await settle();
    expect(error).toHaveBeenCalledWith('Service worker registration failed:', new Error('offline'));
    vi.unstubAllEnvs();
  });
  it('does nothing when service workers are unavailable', () => {
    vi.stubGlobal('navigator', {});
    const listen = vi.spyOn(window, 'addEventListener');
    registerServiceWorker();
    expect(listen).not.toHaveBeenCalled();
  });
});
