import { describe, expect, it, vi } from 'vitest';

import { settle } from '../../__fixtures__/browser';

import {
  isPlayByEarRoute,
  playByEarSongId,
  replacePlayByEarSongUrl,
  setPlayByEarSongUrl,
} from './songRoute';
import { createYouTubeSectionPlayer } from './youtubePlayer';

describe('YouTube section player', () => {
  it('cues and loops sections, preserves playback rate and reports player states and errors', async () => {
    expect.hasAssertions();
    const player = {
      cueVideoById: vi.fn(),
      destroy: vi.fn(),
      loadVideoById: vi.fn(),
      pauseVideo: vi.fn(),
      getAvailablePlaybackRates: vi.fn(() => [0.5, 1, 1.5]),
      getPlaybackRate: vi.fn(() => 1),
      setPlaybackRate: vi.fn(),
    };
    const callbacks = {
      onError: vi.fn(),
      onPaused: vi.fn(),
      onPlaybackRateChange: vi.fn(),
      onPlaying: vi.fn(),
    };
    let events: Record<string, (event: { data: number }) => void> = {};
    const Player = vi.fn(function (_id: string, options: { events: typeof events }) {
      events = options.events;
      queueMicrotask(() => events.onReady?.({ data: 0 }));
      return player;
    });
    vi.stubGlobal('YT', { Player, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, CUED: 5 } });
    const section = { videoId: 'song', startSeconds: 12, endSeconds: 17 };
    const handle = await createYouTubeSectionPlayer('video', section, callbacks);
    expect(Player).toHaveBeenCalledWith(
      'video',
      expect.objectContaining({
        width: '100%',
        height: '100%',
        videoId: 'song',
        playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
      })
    );
    expect(handle.getAvailablePlaybackRates()).toEqual([0.5, 1, 1.5]);
    expect(handle.getPlaybackRate()).toBe(1);
    handle.setPlaybackRate(0.5);
    expect(player.setPlaybackRate).toHaveBeenCalledWith(0.5);
    handle.playLoop(section);
    events.onStateChange?.({ data: 0 });
    expect(player.loadVideoById).toHaveBeenCalledTimes(2);
    expect(player.loadVideoById).toHaveBeenLastCalledWith(section);
    events.onStateChange?.({ data: 1 });
    expect(callbacks.onPlaying).toHaveBeenCalledOnce();
    expect(player.setPlaybackRate).toHaveBeenCalledTimes(2);
    player.getPlaybackRate.mockReturnValue(0.5);
    events.onStateChange?.({ data: 5 });
    expect(player.setPlaybackRate).toHaveBeenCalledTimes(2);
    events.onStateChange?.({ data: 2 });
    expect(callbacks.onPaused).toHaveBeenCalledOnce();
    events.onStateChange?.({ data: -1 });
    events.onPlaybackRateChange?.({ data: 1.5 });
    expect(callbacks.onPlaybackRateChange).toHaveBeenCalledWith(1.5);
    handle.cue({ ...section, startSeconds: 20 });
    expect(player.cueVideoById).toHaveBeenCalledWith({ ...section, startSeconds: 20 });
    events.onStateChange?.({ data: 0 });
    expect(player.loadVideoById).toHaveBeenCalledTimes(2);
    for (const code of [100, 101, 150, 153, 2]) events.onError?.({ data: code });
    expect(callbacks.onError.mock.calls).toEqual([
      ['This video has been removed or made private.'],
      ['This video does not allow embedded playback.'],
      ['This video does not allow embedded playback.'],
      ['YouTube could not identify this embedded player.'],
      ['This video could not be played here.'],
    ]);
    handle.pause();
    expect(player.pauseVideo).toHaveBeenCalledOnce();
    handle.destroy();
    expect(player.destroy).toHaveBeenCalledOnce();
  });
  it('waits for the iframe API and forwards an existing readiness handler', async () => {
    vi.resetModules();
    const { createYouTubeSectionPlayer: create } = await import('./youtubePlayer');
    const previousReady = vi.fn();
    vi.stubGlobal('onYouTubeIframeAPIReady', previousReady);
    vi.stubGlobal('YT', null);
    const callbacks = {
      onError: vi.fn(),
      onPaused: vi.fn(),
      onPlaybackRateChange: vi.fn(),
      onPlaying: vi.fn(),
    };
    const promise = create('video', { videoId: 'song', startSeconds: 0, endSeconds: 1 }, callbacks);
    const second = create('other', { videoId: 'other', startSeconds: 0, endSeconds: 1 }, callbacks);
    const settled = Promise.allSettled([promise, second]);
    (window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady();
    expect(await settled).toEqual([
      { status: 'rejected', reason: new Error('YouTube player API did not load') },
      { status: 'rejected', reason: new Error('YouTube player API did not load') },
    ]);
    expect(previousReady).toHaveBeenCalledOnce();
    await settle();
  });
  it('times out when the iframe API never becomes ready', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubGlobal('YT', null);
    const { createYouTubeSectionPlayer: create } = await import('./youtubePlayer');
    const promise = create(
      'video',
      { videoId: 'song', startSeconds: 0, endSeconds: 1 },
      { onError: vi.fn(), onPaused: vi.fn(), onPlaybackRateChange: vi.fn(), onPlaying: vi.fn() }
    );
    const settled = Promise.allSettled([promise]);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await settled).toEqual([
      { status: 'rejected', reason: new Error('YouTube player API is unavailable') },
    ]);
  });
});

describe('song routes', () => {
  it('parses only song routes and updates or replaces the URL', () => {
    expect(isPlayByEarRoute('#play-by-ear/song')).toBe(true);
    expect(isPlayByEarRoute('#melodies')).toBe(false);
    expect(playByEarSongId('#play-by-ear/song')).toBe('song');
    expect(playByEarSongId('#play-by-ear')).toBeNull();
    expect(playByEarSongId('#scales/song')).toBeNull();
    replacePlayByEarSongUrl('first');
    expect(isPlayByEarRoute()).toBe(true);
    expect(playByEarSongId()).toBe('first');
    setPlayByEarSongUrl('second');
    expect(window.location.hash).toBe('#play-by-ear/second');
    setPlayByEarSongUrl('second');
    expect(playByEarSongId()).toBe('second');
  });
});
