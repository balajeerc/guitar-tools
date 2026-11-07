import { describe, expect, it, vi } from 'vitest';

import { element, mountApp, resizeCallbacks } from '../__fixtures__/browser';

import { getLayoutConfig, observeFretboardResize } from './layout';
import { requiredAt } from './requiredAt';

describe('responsive board notifications', () => {
  it('notifies only after a measured width change and tolerates an empty notification', () => {
    expect.hasAssertions();
    mountApp();
    const changed = vi.fn();
    observeFretboardResize(changed);
    const callback = requiredAt(resizeCallbacks, 0);
    const observer = new ResizeObserver(vi.fn());
    callback([], observer);
    expect(changed).not.toHaveBeenCalled();
    for (const width of [0, 100, 100, 200]) {
      const entry: ResizeObserverEntry = {
        target: element('.container'),
        contentRect: new DOMRect(0, 0, width, 100),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };
      callback([entry], observer);
    }
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it('uses the full vertical geometry on phones and the exact breakpoint query', async () => {
    vi.resetModules();
    const layout = await import('./layout');
    Object.defineProperty(window.matchMedia('(max-width: 767px)'), 'matches', { value: true });
    const media = vi.spyOn(window, 'matchMedia');
    expect(layout.getLayoutConfig()).toEqual({
      isVertical: true,
      fretAxis: 'top',
      stringAxis: 'left',
      fretDimension: 'height',
      stringThicknessProp: 'width',
      nutPosition: 50,
      fretWidth: 55,
      fretboardLength: 1260,
      fretboardContainerPadding: 0,
    });
    expect(media).toHaveBeenLastCalledWith('(max-width: 767px)');
  });
  it('uses a usable desktop board without a container and skips observing it', () => {
    const changed = vi.fn();
    expect(getLayoutConfig()).toEqual({
      isVertical: false,
      fretAxis: 'left',
      stringAxis: 'top',
      fretDimension: 'width',
      stringThicknessProp: 'height',
      nutPosition: 50,
      fretWidth: 1350 / 22,
      fretboardLength: 1400,
      fretboardContainerPadding: 40,
    });
    observeFretboardResize(changed);
    expect(resizeCallbacks).toHaveLength(0);
    expect(changed).not.toHaveBeenCalled();
  });
});
