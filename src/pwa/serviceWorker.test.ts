import { describe, expect, it, vi } from 'vitest';

import { settle } from '../__fixtures__/browser';
import { requiredAt } from '../shared/requiredAt';

interface WorkerEvent {
  request: { mode: string; url: string };
  respondWith: (response: Promise<unknown>) => void;
  waitUntil: (work: Promise<unknown>) => void;
}

async function worker() {
  vi.resetModules();
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const scope = 'https://example.test/guitar-tools/';
  const name = `guitar-tools:${scope}:v3`;
  const cache = { addAll: vi.fn(() => Promise.resolve()), put: vi.fn(() => Promise.resolve()) };
  const storage = {
    open: vi.fn(() => Promise.resolve(cache)),
    keys: vi.fn(() => Promise.resolve([name, `guitar-tools:${scope}:v2`, 'another-app:v2'])),
    delete: vi.fn(() => Promise.resolve(true)),
    match: vi.fn<(request: unknown) => Promise<unknown>>(() => Promise.resolve()),
  };
  const response = { status: 200, type: 'basic', clone: vi.fn(() => ({ cloned: true })) };
  const network = vi.fn<(request: unknown) => Promise<unknown>>(() => Promise.resolve(response));
  const skipWaiting = vi.fn();
  const claim = vi.fn();
  vi.stubGlobal('self', {
    registration: { scope },
    clients: { claim },
    skipWaiting,
    addEventListener: (type: string, listener: (event: WorkerEvent) => void) => {
      listeners.set(type, listener);
    },
  });
  vi.stubGlobal('caches', storage);
  vi.stubGlobal('fetch', network);
  const modulePath = '../../public/sw.js';
  await import(modulePath);

  async function dispatch(type: string, mode = 'cors') {
    const pending: Promise<unknown>[] = [];
    const responses: Promise<unknown>[] = [];
    const request = { mode, url: `${scope}asset.js` };
    listeners.get(type)?.({
      request,
      waitUntil: (work) => {
        pending.push(work);
      },
      respondWith: (result) => {
        responses.push(result);
      },
    });
    await Promise.all(pending);
    await settle();
    return { request, responses, pending };
  }
  return { cache, storage, response, network, skipWaiting, claim, dispatch, name };
}

describe('offline service worker', () => {
  it('preloads scoped app assets and activates without deleting another app cache', async () => {
    const sw = await worker();
    const install = await sw.dispatch('install');
    expect(install.pending).toHaveLength(1);
    expect(sw.storage.open).toHaveBeenCalledWith(sw.name);
    expect(sw.cache.addAll).toHaveBeenCalledWith([
      'https://example.test/guitar-tools/',
      'https://example.test/guitar-tools/index.html',
      'https://example.test/guitar-tools/manifest.webmanifest',
      'https://example.test/guitar-tools/favicon.png',
      'https://example.test/guitar-tools/icons/icon-192x192.png',
      'https://example.test/guitar-tools/icons/icon-512x512.png',
    ]);
    expect(sw.skipWaiting).toHaveBeenCalledOnce();
    await sw.dispatch('activate');
    expect(sw.storage.delete).toHaveBeenCalledExactlyOnceWith(
      'guitar-tools:https://example.test/guitar-tools/:v2'
    );
    expect(sw.claim).toHaveBeenCalledOnce();
  });
  it('uses fresh navigation responses and falls back to cached HTML offline', async () => {
    const sw = await worker();
    sw.storage.match.mockResolvedValue('stale cached page');
    const online = await sw.dispatch('fetch', 'navigate');
    expect(await requiredAt(online.responses, 0)).toBe(sw.response);
    expect(sw.network).toHaveBeenCalledWith(online.request);
    expect(sw.cache.put).toHaveBeenCalledWith(online.request, { cloned: true });
    sw.network.mockRejectedValueOnce(new Error('offline'));
    sw.storage.match.mockResolvedValueOnce('cached page');
    const offline = await sw.dispatch('fetch', 'navigate');
    expect(await requiredAt(offline.responses, 0)).toBe('cached page');
  });
  it('serves cached assets before consulting the network', async () => {
    const sw = await worker();
    sw.storage.match.mockResolvedValueOnce('cached asset');
    const event = await sw.dispatch('fetch');
    expect(await requiredAt(event.responses, 0)).toBe('cached asset');
    expect(sw.network).not.toHaveBeenCalled();
    expect(sw.cache.put).not.toHaveBeenCalled();
  });
  it.each([
    { status: 200, type: 'basic', writes: 1 },
    { status: 404, type: 'basic', writes: 0 },
    { status: 200, type: 'opaque', writes: 0 },
    { status: 201, type: 'basic', writes: 0 },
  ])(
    'caches only successful same-origin responses ($status $type)',
    async ({ status, type, writes }) => {
      const sw = await worker();
      Object.assign(sw.response, { status, type });
      const event = await sw.dispatch('fetch');
      expect(await requiredAt(event.responses, 0)).toBe(sw.response);
      expect(sw.cache.put).toHaveBeenCalledTimes(writes);
    }
  );
});
