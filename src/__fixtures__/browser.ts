import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, vi } from 'vitest';

export function mountApp(): void {
  const html = readFileSync('index.html', 'utf8');
  document.documentElement.innerHTML = html
    .replace(/<!doctype html>/i, '')
    .replace(/<script\b[^>]*>[\S\s]*?<\/script>/g, '')
    .replace(/<link\b[^>]*>/g, '');
}

export function element(selector: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

export function click(selector: string): void {
  element(selector).click();
}

export function change(selector: string, value: string): void {
  const control = element(selector) as HTMLInputElement;
  control.value = value;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

export const mediaQueries = new Map<string, MediaQueryList>();
export const resizeCallbacks: ResizeObserverCallback[] = [];
export const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

export function frame(now: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(now);
}

export async function settle(): Promise<void> {
  for (let index = 0; index < 10; index++) await Promise.resolve();
}

export function audioHarness() {
  const events: { args: unknown[]; method: string; node: number }[] = [];
  const nodes: Record<string, unknown>[] = [];
  function param(id: number, key: string) {
    return {
      value: 0,
      setValueAtTime: vi.fn((...args: unknown[]) =>
        events.push({ node: id, method: `${key}.set`, args })
      ),
      linearRampToValueAtTime: vi.fn((...args: unknown[]) =>
        events.push({ node: id, method: `${key}.linear`, args })
      ),
      exponentialRampToValueAtTime: vi.fn((...args: unknown[]) =>
        events.push({ node: id, method: `${key}.exponential`, args })
      ),
      setTargetAtTime: vi.fn((...args: unknown[]) =>
        events.push({ node: id, method: `${key}.target`, args })
      ),
    };
  }
  function node(kind: string) {
    const id = nodes.length;
    const result = {
      kind,
      type: '',
      fftSize: 2048,
      connect: vi.fn((destination: Record<string, unknown>) => {
        events.push({ node: id, method: 'connect', args: [nodes.indexOf(destination)] });
      }),
      disconnect: vi.fn(() => {
        events.push({ node: id, method: 'disconnect', args: [] });
      }),
      start: vi.fn((...args: unknown[]) => events.push({ node: id, method: 'start', args })),
      stop: vi.fn((...args: unknown[]) => events.push({ node: id, method: 'stop', args })),
      getFloatTimeDomainData: vi.fn((buffer: Float32Array) => buffer.fill(0)),
      gain: param(id, 'gain'),
      frequency: param(id, 'frequency'),
      Q: param(id, 'Q'),
      threshold: param(id, 'threshold'),
      knee: param(id, 'knee'),
      ratio: param(id, 'ratio'),
      attack: param(id, 'attack'),
      release: param(id, 'release'),
    };
    nodes.push(result);
    return result;
  }
  const buffers: { getChannelData: () => Float32Array; length: number; sampleRate: number }[] = [];
  const analysers: ReturnType<typeof node>[] = [];
  const sources: ReturnType<typeof node>[] = [];
  const context = {
    currentTime: 10,
    sampleRate: 8000,
    state: 'running',
    destination: node('destination'),
    createGain: vi.fn(() => node('gain')),
    createOscillator: vi.fn(() => node('oscillator')),
    createBiquadFilter: vi.fn(() => node('filter')),
    createDynamicsCompressor: vi.fn(() => node('compressor')),
    createBufferSource: vi.fn(() => {
      const result = node('bufferSource');
      sources.push(result);
      return result;
    }),
    createAnalyser: vi.fn(() => {
      const result = node('analyser');
      analysers.push(result);
      return result;
    }),
    createMediaStreamSource: vi.fn(() => node('mediaStream')),
    createBuffer: vi.fn((_channels: number, length: number, sampleRate: number) => {
      const samples = new Float32Array(length);
      const buffer = { length, sampleRate, getChannelData: () => samples };
      buffers.push(buffer);
      return buffer;
    }),
    resume: vi.fn(() => {
      context.state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => {
      context.state = 'closed';
      return Promise.resolve();
    }),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  function snapshot() {
    return nodes.map(({ kind, type, ...properties }) => ({
      kind,
      type,
      params: Object.fromEntries(
        Object.entries(properties).flatMap(([key, value]) => {
          if (value !== null && typeof value === 'object' && 'value' in value)
            return [[key, value.value]];
          return [];
        })
      ),
    }));
  }
  return {
    context,
    snapshot,
    constructor,
    events,
    nodes,
    buffers,
    analysers,
    sources,
    asContext: context as unknown as AudioContext,
  };
}

const globalListenerCleanup: (() => void)[] = [];

function trackGlobalListeners(target: EventTarget): void {
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
    add(type, listener, options);
    globalListenerCleanup.push(() => {
      remove(type, listener, options);
    });
  });
}

beforeEach(() => {
  trackGlobalListeners(document);
  trackGlobalListeners(window);
  localStorage.clear();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  frames.clear();
  mediaQueries.clear();
  resizeCallbacks.length = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    })
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => frames.delete(id))
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const existing = mediaQueries.get(query);
      if (existing) return existing;
      const result = Object.assign(new EventTarget(), {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as MediaQueryList;
      mediaQueries.set(query, result);
      return result;
    })
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true)
  );
  vi.stubGlobal('Option', function Option(text = '', value = text) {
    const option = document.createElement('option');
    option.text = text;
    option.value = value;
    return option;
  });
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  for (const cleanup of globalListenerCleanup.splice(0)) cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
