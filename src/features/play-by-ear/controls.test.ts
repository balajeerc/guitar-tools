import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enterDegrees } from '../../__fixtures__/answers';
import { audioHarness, change, click, element, mountApp, settle } from '../../__fixtures__/browser';
import { requiredAt } from '../../shared/requiredAt';
import { frequencyToNote } from '../note-detection/noteMapper';

import { EAR_TRAINING_SONGS } from './catalog';
import { createSimplifiedVersionPlayer } from './simplifiedPlayer';

let initPlayByEarFeature: () => void;

import type { AudioListenerCallbacks } from '../../__fixtures__/listenerTypes';
import type * as SongCatalog from './catalog';

const testState = vi.hoisted(() => ({
  listeners: [] as AudioListenerCallbacks[],
  listening: false,
  rate: 1,
  inputFailure: false,
  videoFailure: false,
  rateFailure: false,
  callbacks: null as null | {
    onError: (message: string) => void;
    onPaused: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onPlaying: () => void;
  },
  cue: vi.fn(),
  destroy: vi.fn(),
  create: vi.fn(),
}));
vi.mock('./catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof SongCatalog>();
  return {
    ...actual,
    EAR_TRAINING_SONGS: actual.EAR_TRAINING_SONGS.map((song, index) =>
      index === 0
        ? {
            ...song,
            sections: song.sections.flatMap((section) => [
              section,
              { ...section, id: 'second-phrase', label: 'Second phrase' },
            ]),
          }
        : song
    ),
  };
});
vi.mock('../../shared/audioListener', () => ({
  createAudioListener: (callbacks: AudioListenerCallbacks) => {
    testState.listeners.push(callbacks);
    return {
      isListening: () => testState.listening,
      start: () => {
        if (testState.inputFailure) return Promise.reject(new Error('input denied'));
        testState.listening = true;
        return Promise.resolve();
      },
      stop: () => {
        testState.listening = false;
      },
    };
  },
}));
vi.mock('./youtubePlayer', () => ({
  createYouTubeSectionPlayer: (...args: unknown[]) => {
    testState.create(...args);
    if (testState.videoFailure) return Promise.reject(new Error('video unavailable'));
    testState.callbacks = args[2] as typeof testState.callbacks;
    return Promise.resolve({
      getAvailablePlaybackRates: () => [0.5, 1, 1.5],
      getPlaybackRate: () => testState.rate,
      setPlaybackRate: (rate: number) => {
        if (testState.rateFailure) throw new Error('rate unavailable');
        testState.rate = rate;
        testState.callbacks?.onPlaybackRateChange(rate);
      },
      playLoop: () => testState.callbacks?.onPlaying(),
      pause: () => testState.callbacks?.onPaused(),
      cue: testState.cue,
      destroy: testState.destroy,
    });
  },
}));

function mountPractice(): void {
  mountApp();
  window.history.replaceState(null, '', '#play-by-ear');
  initPlayByEarFeature();
}

function acceptMidi(callbacks: AudioListenerCallbacks, midi: number): void {
  const note = frequencyToNote(440 * 2 ** ((midi - 69) / 12));
  callbacks.onNote(null);
  callbacks.onNote(note);
  vi.advanceTimersByTime(50);
  callbacks.onNote(note);
}

describe('Play by Ear user flow', () => {
  beforeEach(async () => {
    vi.resetModules();
    ({ initPlayByEarFeature } = await import('./index'));
    vi.clearAllMocks();
    testState.listening = false;
    testState.rate = 1;
    testState.inputFailure = false;
    testState.videoFailure = false;
    testState.rateFailure = false;
  });

  it('retains heard notes with auto-clear disabled and clears them when re-enabled', async () => {
    vi.useFakeTimers();
    audioHarness();
    mountPractice();
    click('#playEarGuessBtn');
    await settle();
    const listener = requiredAt(testState.listeners, testState.listeners.length - 1);
    acceptMidi(listener, 60);
    click('#playEarAutoClearNotes');
    expect(localStorage.getItem('play-by-ear-auto-clear-notes')).toBe('false');
    await vi.advanceTimersByTimeAsync(5001);
    expect(element('#playEarDetectedNote').textContent).toBe('C4');
    click('#playEarPlayHeardBtn');
    await settle();
    expect(element('#playEarPlayHeardBtn').textContent).toBe('♪ Playing…');
    await vi.advanceTimersByTimeAsync(2000);
    click('#playEarAutoClearNotes');
    await vi.advanceTimersByTimeAsync(5001);
    expect(element('#playEarStatus').textContent).toBe('Recognized notes cleared after 5 seconds');
    expect(element('#play-by-ear-page').innerHTML).toMatchSnapshot('re-enabled note auto-clear');
  });
  it('stops looping video and input and disposes pending note clearing on navigation', async () => {
    vi.useFakeTimers();
    mountPractice();
    click('#playEarLoopBtn');
    await settle();
    click('#playEarGuessBtn');
    await settle();
    const listener = requiredAt(testState.listeners, testState.listeners.length - 1);
    acceptMidi(listener, 60);
    click('#playEarLoopBtn');
    await settle();
    expect(testState.listening).toBe(true);
    window.history.replaceState(null, '', '#scales');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(testState.listening).toBe(false);
    expect(element('#playEarLoopBtn').getAttribute('aria-label')).toBe('Play loop');
    const status = element('#playEarStatus').textContent;
    await vi.advanceTimersByTimeAsync(6000);
    expect(element('#playEarStatus').textContent).toBe(status);
  });
  it('stops synthesized playback when navigating away', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    mountPractice();
    click('#playEarSimplifiedBtn');
    await settle();
    expect(element('#playEarSimplifiedBtn').textContent).toBe('♪ Playing…');
    window.history.replaceState(null, '', '#scales');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(element('#playEarSimplifiedBtn').textContent).toBe('Play simplified version');
    expect(audio.events.some((event) => event.method === 'stop' && event.args.length === 0)).toBe(
      true
    );
  });
  it('restores manual mode, listening preferences and completed sections', () => {
    const song = requiredAt(EAR_TRAINING_SONGS, 0);
    const section = requiredAt(song.sections, 0);
    localStorage.setItem('play-by-ear-guess-method', JSON.stringify('manual'));
    localStorage.setItem('play-by-ear-pause-video', 'false');
    localStorage.setItem('play-by-ear-auto-clear-notes', 'false');
    localStorage.setItem(
      'play-by-ear-completed-sections',
      JSON.stringify([`${song.id}/${section.id}`])
    );
    mountPractice();
    expect((element('#playEarPauseWhileGuessing') as HTMLInputElement).checked).toBe(false);
    expect((element('#playEarAutoClearNotes') as HTMLInputElement).checked).toBe(false);
    expect(element('#playEarManualPanel').hidden).toBe(false);
    expect(element('#play-by-ear-page').innerHTML).toMatchSnapshot(
      'restored manual practice preferences'
    );
  });
  it('reflects looping, heard playback, incorrect notes and a completed microphone attempt', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    audioHarness();
    mountPractice();
    const page = element('#play-by-ear-page');
    const song = requiredAt(EAR_TRAINING_SONGS, 0);
    const section = requiredAt(song.sections, 0);
    click('#playEarSimplifiedBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('playing simplified practice');
    click('#playEarLoopBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('looping practice');
    expect(testState.create).toHaveBeenCalledWith(
      'playEarYoutubePlayer',
      {
        videoId: song.youtubeVideoId,
        startSeconds: section.startSeconds,
        endSeconds: section.endSeconds,
      },
      expect.any(Object)
    );
    click('#playEarSlowerBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('slower looping practice');
    click('#playEarGuessBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('microphone while video paused');
    const listener = requiredAt(testState.listeners, testState.listeners.length - 1);
    acceptMidi(listener, 60);
    click('#playEarPlayHeardBtn');
    await settle();
    expect(page.innerHTML).toMatchSnapshot('playing the heard attempt');
    await vi.advanceTimersByTimeAsync(2000);
    acceptMidi(listener, 61);
    expect(element('#playEarStatus').textContent).toBe('That note doesn’t match yet');
    expect(element('#playEarHint').textContent).toBe('Try that note again.');
    click('#playEarResetNotesBtn');
    expect(page.innerHTML).toMatchSnapshot('reset microphone practice');
    for (const midi of section.notes) acceptMidi(listener, midi);
    expect(element('#playEarStatus').textContent).toBe('You got it!');
    expect(page.innerHTML).toMatchSnapshot('completed microphone practice');
    click('#playEarNextSectionBtn');
    expect(page.innerHTML).toMatchSnapshot('next section after completion');
    click('#playEarPreviousSectionBtn');
    expect(page.innerHTML).toMatchSnapshot('retrying a completed section');
  });

  it('reflects manual progress, accidentals, method changes and revealed answers', () => {
    expect.hasAssertions();
    mountApp();
    window.history.replaceState(null, '', '#play-by-ear');
    initPlayByEarFeature();
    const page = element('#play-by-ear-page');
    expect(page.innerHTML).toMatchSnapshot('initial practice controls');
    click('#playEarManualMethodBtn');
    expect(page.innerHTML).toMatchSnapshot('manual practice');
    expect(localStorage.getItem('play-by-ear-guess-method')).toBe(JSON.stringify('manual'));
    change('#playEarIntervalInput', '123');
    expect(page.innerHTML).toMatchSnapshot('partially entered intervals');
    click('[data-play-ear-accidental="0"]');
    expect(element('#playEarHint').textContent).toBe('Interval 1 changed to ♭1.');
    expect(element('#playEarIntervalBoxes').innerHTML).toMatchSnapshot('changed accidental');
    click('#playEarMicMethodBtn');
    expect(page.innerHTML).toMatchSnapshot('microphone practice');
    click('#playEarManualMethodBtn');
    click('#playEarManualRevealBtn');
    expect(page.innerHTML).toMatchSnapshot('revealed practice');
    click('#playEarNextSectionBtn');
    expect(page.innerHTML).toMatchSnapshot('next practice section');
  });
  describe('playback failure feedback', () => {
    beforeEach(() => {
      mountPractice();
    });
    it('explains a failed video load and permits a retry', async () => {
      testState.videoFailure = true;
      click('#playEarLoopBtn');
      await settle();
      expect(element('#playEarVideoStatus').textContent).toBe(
        'YouTube could not be loaded. Check your connection and try again.'
      );
      testState.videoFailure = false;
      click('#playEarLoopBtn');
      await settle();
      expect(element('#playEarVideoStatus').textContent).toContain('Looping');
    });
    it('explains a rate failure and permits a retry', async () => {
      click('#playEarLoopBtn');
      await settle();
      testState.rateFailure = true;
      click('#playEarFasterBtn');
      await settle();
      expect(element('#playEarVideoStatus').textContent).toBe(
        'Playback speed could not be changed.'
      );
      testState.rateFailure = false;
      click('#playEarFasterBtn');
      await settle();
      expect(element('#playEarPlaybackRate').textContent).toBe('1.5×');
    });
    it('explains denied audio input and permits a retry', async () => {
      testState.inputFailure = true;
      click('#playEarGuessBtn');
      await settle();
      expect(element('#playEarStatus').textContent).toBe('Audio input access is needed');
      expect(element('#playEarHint').textContent).toBe(
        'Allow access, choose an input, then try again.'
      );
      testState.inputFailure = false;
      click('#playEarGuessBtn');
      await settle();
      expect(element('#playEarStatus').textContent).toBe('Play the section back');
    });
    it('explains a failed simplified sound playback', async () => {
      const audio = audioHarness();
      audio.constructor.mockImplementationOnce(function () {
        throw new Error('audio unavailable');
      });
      click('#playEarSimplifiedBtn');
      await settle();
      expect(element('#playEarVideoStatus').textContent).toBe(
        'The simplified version could not be played.'
      );
    });
    it('shows heard-note progress and explains failed heard-note playback', async () => {
      vi.useFakeTimers();
      const audio = audioHarness();
      click('#playEarGuessBtn');
      await settle();
      const listener = requiredAt(testState.listeners, testState.listeners.length - 1);
      const note = { name: 'C', noteIndex: 3, midiNote: 60, centsOff: 0 };
      listener.onNote(note);
      vi.advanceTimersByTime(50);
      listener.onNote(note);
      expect(element('#play-by-ear-page').innerHTML).toMatchSnapshot('heard-note controls');
      audio.constructor.mockImplementationOnce(function () {
        throw new Error('audio unavailable');
      });
      click('#playEarPlayHeardBtn');
      await settle();
      expect(element('#playEarStatus').textContent).toBe('The heard notes could not be played.');
    });
  });
  it('responds to song hash navigation and normalizes the bare practice route', () => {
    mountApp();
    window.history.replaceState(null, '', '#play-by-ear');
    initPlayByEarFeature();
    const other = requiredAt(EAR_TRAINING_SONGS, 1);
    window.history.replaceState(null, '', `#play-by-ear/${other.id}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(element('#playEarSongTitle').textContent).toBe(other.title);
    window.history.replaceState(null, '', '#play-by-ear');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(window.location.hash).toBe(`#play-by-ear/${other.id}`);
  });
  it('loops video sections, changes speed, checks intervals and remembers completed sections', async () => {
    vi.useFakeTimers();
    audioHarness();
    mountApp();
    const song = requiredAt(EAR_TRAINING_SONGS, 0);
    const section = requiredAt(song.sections, 0);
    window.history.replaceState(null, '', '#play-by-ear');
    initPlayByEarFeature();
    expect(window.location.hash).toBe(`#play-by-ear/${song.id}`);
    expect(element('#playEarSongTitle').textContent).toBe(song.title);
    click('#playEarLoopBtn');
    await settle();
    expect(element('#playEarVideoStatus').textContent).toBe(`Looping ${section.label}`);
    expect(element('#playEarLoopBtn').getAttribute('aria-label')).toBe('Restart loop');
    expect(testState.create).toHaveBeenCalledOnce();
    click('#playEarSlowerBtn');
    await settle();
    expect(element('#playEarPlaybackRate').textContent).toBe('0.5×');
    click('#playEarFasterBtn');
    await settle();
    expect(element('#playEarPlaybackRate').textContent).toBe('1×');
    click('#playEarManualMethodBtn');
    expect(element('#playEarMicrophonePanel').hidden).toBe(true);
    change('#playEarIntervalInput', '1'.repeat(section.notes.length));
    click('#playEarCheckBtn');
    expect(element('#playEarStatus').textContent).toContain('intervals are right');
    enterDegrees('#playEarIntervalInput', 'play-ear', section.degrees);
    click('#playEarIntervalEntry');
    expect(document.activeElement?.id).toBe('playEarIntervalInput');
    click('#playEarCheckBtn');
    expect(element('#playEarStatus').textContent).toBe('You got it!');
    expect(JSON.parse(localStorage.getItem('play-by-ear-completed-sections') ?? '[]')).toContain(
      `${song.id}/${section.id}`
    );
    expect(element('#playEarResult').innerHTML).toMatchSnapshot('matched section');
    click('#playEarNextSectionBtn');
    expect(element('#playEarSectionCounter').textContent).toContain('2 of');
    click('#playEarPreviousSectionBtn');
    expect(element('#playEarSectionCounter').textContent).toContain('1 of');
    click('#playEarManualRevealBtn');
    expect(element('#playEarStatus').textContent).toBe('Answer revealed');
    click('[data-section-index="1"]');
    click('#playEarMicMethodBtn');
    click('#playEarPauseWhileGuessing');
    click('#playEarAutoClearNotes');
    expect(localStorage.getItem('play-by-ear-pause-video')).toBe('false');
    expect(localStorage.getItem('play-by-ear-auto-clear-notes')).toBe('false');
    click('#playEarSimplifiedBtn');
    await settle();
    expect(element('#playEarSimplifiedBtn').textContent).toBe('♪ Playing…');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(element('#playEarSimplifiedBtn').textContent).toBe('Play simplified version');
    const other = requiredAt(EAR_TRAINING_SONGS, 1);
    change('#playEarSongSelect', other.id);
    expect(element('#playEarSongTitle').textContent).toBe(other.title);
    testState.callbacks?.onError('Video unavailable');
    expect(element('#playEarVideoStatus').textContent).toBe('Video unavailable');
    window.history.replaceState(null, '', '#scales');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(testState.listening).toBe(false);
  });
  it('recognizes notes, clears stale attempts, plays heard notes and handles input failure', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    audioHarness();
    mountApp();
    window.history.replaceState(null, '', '#play-by-ear');
    initPlayByEarFeature();
    click('#playEarGuessBtn');
    await settle();
    expect(element('#playEarStatus').textContent).toBe('Play the section back');
    const listener = requiredAt(testState.listeners, testState.listeners.length - 1);
    const note = { name: 'C', noteIndex: 3, midiNote: 60, centsOff: 0 };
    listener.onNote(note);
    vi.advanceTimersByTime(50);
    listener.onNote(note);
    expect(element('#playEarDetectedNote').textContent).toBe('C4');
    click('#playEarPlayHeardBtn');
    await settle();
    expect(element('#playEarPlayHeardBtn').textContent).toBe('♪ Playing…');
    await vi.advanceTimersByTimeAsync(2000);
    click('#playEarResetNotesBtn');
    expect(element('#playEarStatus').textContent).toBe('Recognized notes cleared');
    listener.onNote(note);
    vi.advanceTimersByTime(50);
    listener.onNote(note);
    await vi.advanceTimersByTimeAsync(5000);
    expect(element('#playEarStatus').textContent).toBe('Recognized notes cleared after 5 seconds');
    const song = requiredAt(EAR_TRAINING_SONGS, 0);
    const section = requiredAt(song.sections, 0);
    for (const midi of section.notes) {
      const detected = { name: 'A', noteIndex: 0, midiNote: midi, centsOff: 0 };
      listener.onNote(null);
      listener.onNote(detected);
      vi.advanceTimersByTime(50);
      listener.onNote(detected);
    }
    expect(element('#playEarStatus').textContent).toBe('You got it!');
    click('#playEarNextSectionBtn');
    click('#playEarGuessBtn');
    await settle();
    click('#playEarGuessBtn');
    expect(element('#playEarStatus').textContent).toBe('Listening stopped');
    listener.onError?.();
    expect(element('#playEarStatus').textContent).toBe('The selected audio input is unavailable');
    click('#playEarRevealBtn');
    expect(element('#playEarResult').hidden).toBe(false);
    window.history.replaceState(null, '', '#scales');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  it('tracks simplified and heard playback and cancels stale completions', async () => {
    vi.useFakeTimers();
    audioHarness();
    const song = requiredAt(EAR_TRAINING_SONGS, 0);
    const section = requiredAt(song.sections, 0);
    const player = createSimplifiedVersionPlayer();
    expect(player.isPlaying()).toBe(false);
    const playing = player.play(song, section);
    expect(player.playingSource()).toBe('expected');
    player.stop();
    expect(player.playingSource()).toBeNull();
    const heard = player.playNotes([60, 64]);
    expect(player.playingSource()).toBe('heard');
    await vi.advanceTimersByTimeAsync(20_000);
    await playing;
    await heard;
    expect(player.isPlaying()).toBe(false);
    const empty = player.playNotes([]);
    await vi.advanceTimersByTimeAsync(100);
    await empty;
    expect(player.playingSource()).toBeNull();
  });
});
