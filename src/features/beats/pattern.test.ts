import { describe, expect, it, vi } from 'vitest';

import {
  clampBeats,
  clampBpm,
  defaultAccents,
  nextAccent,
  resizeAccents,
} from '../metronome/beats';
import { createHeardNoteQueue } from '../play-by-ear/heardNoteQueue';

import { deleteBeatLoop, loadSavedLoops, saveBeatLoop } from './loops';
import { createDefaultPattern, DEFAULT_LEVELS, normalizeLevels, normalizePattern } from './pattern';

describe('rhythm settings', () => {
  it('creates independent 16-step patterns and preserves only boolean hits', () => {
    const first = createDefaultPattern();
    expect(first.kick).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(first.snare.filter(Boolean)).toHaveLength(2);
    expect(first.hihat.filter(Boolean)).toHaveLength(8);
    expect(first.crash.filter(Boolean)).toHaveLength(1);
    first.kick[0] = false;
    expect(createDefaultPattern().kick[0]).toBe(true);
    expect(normalizePattern({ ...first, kick: [true, 1, null] } as never).kick).toEqual([
      true,
      ...Array<boolean>(15).fill(false),
    ]);
    expect(normalizePattern({ ...first, kick: null } as never).kick).toEqual(
      createDefaultPattern().kick
    );
    expect(normalizeLevels({ kick: -1, snare: 2, hihat: Number.NaN, crash: 0.5 })).toEqual({
      kick: 0,
      snare: 1,
      hihat: DEFAULT_LEVELS.hihat,
      crash: 0.5,
    });
  });
  it.each([
    [0, 30, 1],
    [99.6, 100, 12],
    [999, 260, 12],
  ])('clamps tempo and meter %s', (value, tempo, beats) => {
    expect(clampBpm(value)).toBe(tempo);
    expect(clampBeats(value)).toBe(beats);
  });
  it('cycles accents and retains edits when resizing', () => {
    expect(nextAccent('strong')).toBe('weak');
    expect(nextAccent('weak')).toBe('off');
    expect(nextAccent('off')).toBe('strong');
    expect(defaultAccents(3)).toEqual(['strong', 'weak', 'weak']);
    expect(resizeAccents(['off', 'strong'], 3)).toEqual(['off', 'strong', 'weak']);
    expect(resizeAccents(['off', 'strong'], 1)).toEqual(['off']);
    expect(defaultAccents(0)).toEqual([]);
  });
});

describe('saved rhythm loops', () => {
  const state = { bpm: 120, pattern: createDefaultPattern(), levels: DEFAULT_LEVELS };
  it('saves snapshots, overwrites case-insensitively and deletes only the selected loop', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123);
    const result = saveBeatLoop([], '  My Loop  ', state);
    expect(result.overwritten).toBe(false);
    expect(result.saved).toEqual({ id: 'beat-loop-123', name: 'My Loop', ...state });
    expect(loadSavedLoops()).toEqual(result.loops);
    const overwritten = saveBeatLoop(result.loops, 'my loop', { ...state, bpm: 500 });
    expect(overwritten).toMatchObject({
      overwritten: true,
      saved: { id: 'beat-loop-123', name: 'my loop', bpm: 260 },
    });
    expect(overwritten.loops).toHaveLength(1);
    expect(deleteBeatLoop(overwritten.loops, 'unrelated')).toEqual(overwritten.loops);
    expect(deleteBeatLoop(overwritten.loops, result.saved.id)).toEqual([]);
    expect(loadSavedLoops()).toEqual([]);
  });
  it.each([
    null,
    {},
    'bad',
    [null],
    [{ id: 1 }],
    [{ id: 1, name: 'valid', ...state }],
    [{ id: 'valid', name: 1, ...state }],
    [{ id: '', name: 'x', ...state }],
    [{ id: 'x', name: ' ', ...state }],
    [{ id: 'x', name: 'x', ...state, bpm: '120' }],
    [{ id: 'x', name: 'x', ...state, pattern: null }],
    [{ id: 'x', name: 'x', ...state, pattern: { kick: [] } }],
    [{ id: 'x', name: 'x', ...state, levels: {} }],
    [{ id: 'x', name: 'x', ...state, levels: { kick: 1 } }],
  ])('ignores malformed saved state %j', (stored) => {
    localStorage.setItem('beats-saved-loops', JSON.stringify(stored));
    expect(loadSavedLoops()).toEqual([]);
  });
  it('truncates names and clamps imported state', () => {
    localStorage.setItem(
      'beats-saved-loops',
      JSON.stringify([{ id: 'x', name: 'a'.repeat(50), ...state, bpm: 0 }])
    );
    expect(loadSavedLoops()).toMatchObject([{ id: 'x', name: 'a'.repeat(40), bpm: 30 }]);
  });
  it('keeps unrelated loops while adding and overwriting long named patterns', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1);
    const first = saveBeatLoop([], 'Original', state);
    vi.spyOn(Date, 'now').mockReturnValue(2);
    const second = saveBeatLoop(first.loops, 'b'.repeat(50), state);
    expect(second.saved.name).toBe('b'.repeat(40));
    expect(second.loops).toEqual([first.saved, second.saved]);
    const changed = saveBeatLoop(second.loops, 'ORIGINAL', { ...state, bpm: 90 });
    expect(changed.loops).toEqual([{ ...first.saved, name: 'ORIGINAL', bpm: 90 }, second.saved]);
    expect(first.saved.bpm).toBe(120);
  });
});

describe('heard note queue', () => {
  it('keeps a bounded copy, reschedules automatic clearing and cancels on disposal', () => {
    vi.useFakeTimers();
    const clear = vi.fn();
    const queue = createHeardNoteQueue(2, 100, true, clear);
    queue.add(60);
    vi.advanceTimersByTime(99);
    queue.add(62);
    queue.add(64);
    expect(queue.values()).toEqual([62, 64]);
    vi.advanceTimersByTime(99);
    expect(clear).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(queue.values()).toEqual([]);
    expect(clear).toHaveBeenCalledTimes(1);
    queue.setAutoClear(false);
    queue.add(67);
    vi.advanceTimersByTime(1000);
    expect(queue.values()).toEqual([67]);
    queue.setAutoClear(true);
    queue.dispose();
    vi.advanceTimersByTime(1000);
    expect(queue.values()).toEqual([67]);
    queue.clear();
    expect(queue.values()).toEqual([]);
    queue.setAutoClear(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
