import { describe, expect, it, vi } from 'vitest';

import { audioHarness, click, element, mountApp, settle } from './__fixtures__/browser';
import { initFretboardSound } from './shared/fretboardSound';

vi.mock('./features/beats', () => ({ initBeatsFeature: vi.fn() }));
vi.mock('./features/circle-of-fifths', () => ({ initCircleOfFifthsFeature: vi.fn() }));
vi.mock('./features/ear-trainer', () => ({ initEarTrainerFeature: vi.fn() }));
vi.mock('./features/fret-walk', () => ({ initFretWalkFeature: vi.fn() }));
vi.mock('./features/fretboard-discovery', () => ({ initFretboardDiscoveryFeature: vi.fn() }));
vi.mock('./features/listener', () => ({ initListenerFeature: vi.fn() }));
vi.mock('./features/melodies', () => ({ initMelodiesFeature: vi.fn() }));
vi.mock('./features/metronome', () => ({ initMetronomeFeature: vi.fn() }));
vi.mock('./features/play-by-ear', () => ({ initPlayByEarFeature: vi.fn() }));
vi.mock('./features/scales', () => ({ initScalesFeature: vi.fn() }));
vi.mock('./features/triads', () => ({ initTriadsFeature: vi.fn() }));
vi.mock('./features/tuner', () => ({ initTunerFeature: vi.fn() }));

const startupFeatures = [
  ['./features/beats', 'initBeatsFeature'],
  ['./features/circle-of-fifths', 'initCircleOfFifthsFeature'],
  ['./features/ear-trainer', 'initEarTrainerFeature'],
  ['./features/fret-walk', 'initFretWalkFeature'],
  ['./features/fretboard-discovery', 'initFretboardDiscoveryFeature'],
  ['./features/listener', 'initListenerFeature'],
  ['./features/melodies', 'initMelodiesFeature'],
  ['./features/metronome', 'initMetronomeFeature'],
  ['./features/play-by-ear', 'initPlayByEarFeature'],
  ['./features/scales', 'initScalesFeature'],
  ['./features/triads', 'initTriadsFeature'],
  ['./features/tuner', 'initTunerFeature'],
] as const;
async function startupInitializers(): Promise<unknown[]> {
  return Promise.all(
    startupFeatures.map(async ([path, name]) => {
      const module: unknown = await import(path);
      return (module as Record<string, unknown>)[name];
    })
  );
}

describe('app startup and navigation', () => {
  it('initializes every tool and routes hashes to one visible page', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    mountApp();
    await import('./main');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await settle();
    expect(element('#scales-page').style.display).toBe('block');
    for (const init of await startupInitializers()) expect(init).toHaveBeenCalledOnce();
    expect(document.querySelectorAll('.nav-container .theme-toggle')).toHaveLength(1);
    expect(document.querySelectorAll('.nav-container .sound-toggle')).toHaveLength(1);
    for (const route of [
      'triads',
      'fret-walk',
      'fretboard-discovery',
      'circle-of-fifths',
      'melodies',
      'ear-trainer',
      'play-by-ear',
      'listener',
      'tuner',
      'metronome',
      'beats',
      'scales',
    ]) {
      window.history.replaceState(null, '', `#${route}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      expect(element(`#${route}-page`).style.display).toBe('block');
      expect(
        [...document.querySelectorAll<HTMLElement>('.page')].filter(
          (page) => page.style.display === 'block'
        )
      ).toHaveLength(1);
      expect(element(`.nav-link[href="#${route}"]`).classList.contains('active')).toBe(true);
    }
    window.history.replaceState(null, '', '#missing');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(element('#scales-page').style.display).toBe('block');
    window.history.replaceState(null, '', '#');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(element('#scales-page').style.display).toBe('block');
  });
  it('plays physical fret positions and synchronizes sound preferences', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    audio.context.state = 'suspended';
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(12345);
      return array;
    });
    mountApp();
    initFretboardSound();
    element('#fretboard').dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 25, clientY: 180 })
    );
    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(audio.events).toMatchSnapshot('pluck envelope');
    const buffer = audio.buffers[0];
    expect(buffer?.length).toBe(19200);
    expect([...(buffer?.getChannelData().slice(0, 64) ?? [])]).toMatchSnapshot(
      'modeled string attack'
    );
    expect(element('.fretboard-sound-tap').style.left).toBe('25px');
    element('.fretboard-sound-tap').dispatchEvent(new Event('animationend'));
    expect(document.querySelector('.fretboard-sound-tap')).toBeNull();
    await vi.advanceTimersByTimeAsync(2500);
    expect(audio.sources[0]?.disconnect).toHaveBeenCalledOnce();
    click('.nav-container .sound-toggle');
    expect(localStorage.getItem('fretboard-sound-enabled')).toBe('false');
    expect(element('#sidebarSoundToggle .sound-toggle').getAttribute('aria-pressed')).toBe('false');
    element('#fretboard').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(audio.context.createBufferSource).toHaveBeenCalledOnce();
    click('#sidebarSoundToggle .sound-toggle');
    expect(element('.nav-container .sound-toggle').getAttribute('aria-label')).toBe(
      'Fretboard sound on'
    );
    Object.defineProperty(window.matchMedia('(max-width: 767px)'), 'matches', { value: true });
    element('#fretboard').dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 50 })
    );
    expect(element('.fretboard-sound-tap').style.left).toBe('20px');
    expect(audio.context.createBufferSource).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2500);
  });
});
