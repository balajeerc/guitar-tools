import { describe, expect, it, vi } from 'vitest';

import { audioHarness, frame, settle } from '../__fixtures__/browser';
import { createDrumKit, voicesAtStep } from '../features/beats/instruments';
import { createDefaultPattern, DEFAULT_LEVELS } from '../features/beats/pattern';
import { createBeatsPlayback } from '../features/beats/playback';
import { createBeatsScheduler } from '../features/beats/scheduler';
import { createMelodyPlayer } from '../features/melodies/playback';
import { isMelodyTone, melodyToneProfile } from '../features/melodies/tone';
import { playClick } from '../features/metronome/click';
import { createPlayback } from '../features/metronome/playback';
import { createScheduler } from '../features/metronome/scheduler';
import {
  highlightBeat,
  pendulumAngle,
  renderBeatDots,
  setPendulumAngle,
} from '../features/metronome/visuals';
import { detectPitch } from '../features/note-detection/pitchDetector';

import { computeRms, releaseMic, setupAudio } from './audioUtils';
import { createScreenWakeLock } from './screenWakeLock';

const melody = {
  id: 'a',
  title: 'A',
  attribution: 'test',
  key: 'A major',
  difficulty: 'easy',
  bpm: 120,
  notes: [
    { midi: 69, beats: 1, restAfterBeats: 0.5 },
    { midi: 81, beats: 0.25 },
  ],
  degrees: ['1', '1'],
} as const;

describe('melody and percussion synthesis', () => {
  it.each(['warm', 'pure', 'bright', 'pluck', 'bass'] as const)(
    'schedules the %s tone with its envelope, pitch, rests and release',
    async (tone) => {
      vi.useFakeTimers();
      const audio = audioHarness();
      audio.context.state = 'suspended';
      const player = createMelodyPlayer();
      const done = player.play(melody, tone);
      await settle();
      expect({ events: audio.events, nodes: audio.snapshot() }).toMatchSnapshot();
      expect(audio.context.resume).toHaveBeenCalledOnce();
      expect(audio.context.createOscillator).toHaveBeenCalledTimes(2);
      expect(melodyToneProfile(tone)).toMatchSnapshot();
      expect(isMelodyTone(tone)).toBe(tone !== 'bass');
      player.stop();
      expect(
        audio.events
          .filter((event) => event.method === 'stop')
          .slice(-2)
          .map((event) => event.args)
      ).toEqual([[], []]);
      await vi.advanceTimersByTimeAsync(2000);
      await done;
      const again = player.play({ ...melody, notes: [{ midi: 57, beats: 0.01 }] }, tone);
      await settle();
      expect(audio.constructor).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(2000);
      await again;
    }
  );
  it.each(['strong', 'weak', 'subdivision'] as const)('schedules a %s click', (kind) => {
    const audio = audioHarness();
    playClick(audio.asContext, kind, 5);
    expect({ events: audio.events, nodes: audio.snapshot() }).toMatchSnapshot();
    expect(audio.context.createOscillator).toHaveBeenCalledOnce();
  });
  it('mixes all drum voices with track levels and disconnects the output', () => {
    const audio = audioHarness();
    audio.context.sampleRate = 12000;
    const random = vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).fill(12345);
      return array;
    });
    const kit = createDrumKit(audio.asContext);
    expect(random.mock.calls.map(([view]) => (view as Uint32Array).length)).toEqual([16384, 7616]);
    expect(audio.buffers[0]?.length).toBe(24000);
    expect(audio.buffers[0]?.getChannelData()[0]).toBeCloseTo(-0.99999425, 7);
    expect(audio.buffers[0]?.getChannelData()[23999]).toBeCloseTo(-0.99999425, 7);
    kit.play('kick', 1, 0.8);
    kit.play('snare', 2, 0.6);
    kit.play('hihat', 3, 0.4);
    kit.play('crash', 4, 0.2);
    expect({ events: audio.events, nodes: audio.snapshot() }).toMatchSnapshot();
    expect(audio.nodes.map((node) => ({ kind: node.kind, type: node.type }))).toMatchSnapshot();
    kit.disconnect();
    expect(
      audio.nodes.find((node) => node.kind === 'compressor')?.disconnect
    ).toHaveBeenCalledOnce();
    expect(voicesAtStep(createDefaultPattern(), DEFAULT_LEVELS, 0)).toEqual([
      { voice: 'kick', level: 0.9 },
      { voice: 'hihat', level: 0.42 },
      { voice: 'crash', level: 0.38 },
    ]);
    expect(voicesAtStep(createDefaultPattern(), DEFAULT_LEVELS, 1)).toEqual([]);
    expect(isMelodyTone(null)).toBe(false);
  });
});

describe('audio-clock scheduling and visual playback', () => {
  it('voices the strong and weak beats and their subdivisions at the audio-clock times', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    const config = {
      bpm: 120,
      beats: 2,
      subdivisions: 2,
      accents: ['strong', 'weak'] as ('strong' | 'weak')[],
    };
    const scheduler = createScheduler(() => config, vi.fn());
    await scheduler.start();
    audio.context.currentTime = 11;
    vi.advanceTimersByTime(25);
    expect({ events: audio.events, nodes: audio.snapshot() }).toMatchSnapshot(
      'audible metronome subdivisions'
    );
    scheduler.stop();
    expect(audio.context.close).toHaveBeenCalledOnce();
  });

  it('schedules subdivisions ahead of time, reads live tempo, wraps the bar and stops cleanly', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    audio.context.state = 'suspended';
    const ticks = vi.fn<(tick: { beat: number; subdivision: number; time: number }) => void>();
    const config = {
      bpm: 120,
      beats: 2,
      subdivisions: 2,
      accents: ['off', 'strong'] as ('off' | 'strong')[],
    };
    const scheduler = createScheduler(() => config, ticks);
    expect(scheduler.now()).toBe(0);
    await scheduler.start();
    await scheduler.start();
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(ticks.mock.calls).toEqual([[{ time: 10.06, beat: 0, subdivision: 0 }]]);
    expect(audio.events).toEqual([]);
    audio.context.currentTime = 11;
    vi.advanceTimersByTime(25);
    expect(ticks.mock.calls.map(([tick]) => tick)).toEqual([
      { time: 10.06, beat: 0, subdivision: 0 },
      { time: 10.31, beat: 0, subdivision: 1 },
      { time: 10.56, beat: 1, subdivision: 0 },
      { time: 10.81, beat: 1, subdivision: 1 },
      { time: 11.06, beat: 0, subdivision: 0 },
    ]);
    config.beats = 1;
    config.bpm = 60;
    config.accents = [];
    audio.context.currentTime = 12;
    vi.advanceTimersByTime(25);
    expect(ticks).toHaveBeenLastCalledWith({ time: 11.81, beat: 0, subdivision: 0 });
    expect(scheduler.now()).toBe(12);
    scheduler.stop();
    scheduler.stop();
    expect(audio.context.close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('runs drum steps and updates the playhead only when a step sounds', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    const onStep = vi.fn<(step: null | number) => void>();
    const config = { bpm: 120, pattern: createDefaultPattern(), levels: DEFAULT_LEVELS };
    const playback = createBeatsPlayback(() => config, onStep);
    await playback.start();
    await playback.start();
    frame(0);
    expect(onStep).not.toHaveBeenCalled();
    audio.context.currentTime = 10.06;
    frame(1);
    expect(onStep).toHaveBeenLastCalledWith(0);
    audio.context.currentTime = 12.1;
    vi.advanceTimersByTime(25);
    frame(2);
    expect(onStep.mock.calls.map(([step]) => step)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0,
    ]);
    playback.stop();
    expect(onStep).toHaveBeenLastCalledWith(null);
    expect(audio.context.close).toHaveBeenCalledOnce();
  });
  it('starts and stops a drum scheduler including the suspended-context path', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    audio.context.state = 'suspended';
    const callback = vi.fn();
    const scheduler = createBeatsScheduler(
      () => ({ bpm: 100, pattern: createDefaultPattern(), levels: DEFAULT_LEVELS }),
      callback
    );
    expect(scheduler.now()).toBe(0);
    scheduler.stop();
    await scheduler.start();
    await scheduler.start();
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(scheduler.now()).toBe(10);
    expect(callback).toHaveBeenCalledWith({ time: 10.06, step: 0 });
    scheduler.stop();
    expect(scheduler.now()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('aligns metronome dots and pendulum with the audible beat', async () => {
    vi.useFakeTimers();
    const audio = audioHarness();
    const onBeat = vi.fn();
    const onAngle = vi.fn();
    const playback = createPlayback(
      () => ({ bpm: 120, beats: 4, subdivisions: 2, accents: ['strong', 'weak', 'weak', 'weak'] }),
      { onBeat, onAngle }
    );
    await playback.start();
    await playback.start();
    frame(0);
    expect(onAngle).toHaveBeenLastCalledWith(0);
    audio.context.currentTime = 10.06;
    frame(1);
    expect(onBeat).toHaveBeenLastCalledWith(0);
    expect(onAngle).toHaveBeenLastCalledWith(30);
    audio.context.currentTime = 10.31;
    frame(2);
    expect(onAngle.mock.lastCall?.[0]).toBeCloseTo(0);
    audio.context.currentTime = 11;
    vi.advanceTimersByTime(25);
    frame(3);
    expect(onBeat).toHaveBeenLastCalledWith(1);
    playback.stop();
    expect(onBeat).toHaveBeenLastCalledWith(null);
    expect(onAngle).toHaveBeenLastCalledWith(0);
    const container = document.createElement('div');
    renderBeatDots(container, ['strong', 'weak', 'off']);
    expect(container.innerHTML).toMatchSnapshot();
    highlightBeat(container, 1);
    expect(container.querySelector('.current')?.getAttribute('data-beat')).toBe('1');
    highlightBeat(container, null);
    expect(container.querySelector('.current')).toBeNull();
    expect(pendulumAngle(1)).toBe(-30);
    setPendulumAngle(container, 12.345);
    expect(container.style.transform).toBe('rotate(12.35deg)');
  });
});

describe('audio acquisition and pitch analysis primitives', () => {
  it('connects the microphone and releases tracks and context', () => {
    const audio = audioHarness();
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const result = setupAudio(stream);
    expect(result.ctx).toBe(audio.context);
    expect(result.node.fftSize).toBe(2048);
    expect(audio.context.createMediaStreamSource).toHaveBeenCalledWith(stream);
    releaseMic(stream, audio.asContext);
    expect(stop).toHaveBeenCalledOnce();
    expect(audio.context.close).toHaveBeenCalledOnce();
    releaseMic(null, null);
    expect(computeRms(new Float32Array([1, -1, 1, -1]))).toBe(1);
    expect(computeRms(new Float32Array([0, 0]))).toBe(0);
    expect(computeRms(new Float32Array([3, 4]))).toBeCloseTo(Math.sqrt(12.5));
  });
  it.each([82.4, 220, 440, 880])('detects a %f Hz sine wave within two Hz', (frequency) => {
    const samples = Float32Array.from({ length: 512 }, (_, index) =>
      Math.sin((2 * Math.PI * frequency * index) / 16000)
    );
    expect(Math.abs((detectPitch(samples, 16000) ?? 0) - frequency)).toBeLessThan(2);
    expect(detectPitch(new Float32Array(512), 16000)).toBeNull();
  });
  it('acquires and releases wake locks and tolerates rejected requests', async () => {
    const release = vi.fn(() => {
      return Promise.resolve();
    });
    const sentinel = Object.assign(new EventTarget(), { release });
    const request = vi.fn(() => Promise.resolve(sentinel));
    vi.stubGlobal('navigator', { wakeLock: { request } });
    const lock = createScreenWakeLock();
    lock.stop();
    lock.start();
    lock.start();
    await settle();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('screen');
    sentinel.dispatchEvent(new Event('release'));
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(request).toHaveBeenCalledTimes(2);
    lock.stop();
    await settle();
    expect(release).toHaveBeenCalledOnce();
    request.mockRejectedValueOnce(new Error('power saving'));
    lock.start();
    await settle();
    lock.stop();
    expect(release).toHaveBeenCalledOnce();
  });
});
