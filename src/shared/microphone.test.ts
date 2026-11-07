import { describe, expect, it, vi } from 'vitest';

import { audioHarness, change, element, frame, settle } from '../__fixtures__/browser';
import * as pitch from '../features/note-detection/pitchDetector';

import {
  AUDIO_INPUT_CHANGED_EVENT,
  audioInputPanelHtml,
  clearSelectedAudioInput,
  createAudioInputPanel,
  getSelectedAudioInputId,
  initAudioInputControls,
  notifyAudioInputsAvailable,
} from './audioInput';
import { createAudioListener } from './audioListener';
import { acquireMic } from './audioUtils';

function devices(getUserMedia = vi.fn(() => Promise.resolve({ id: 'stream' }))) {
  const enumerateDevices = vi.fn(() =>
    Promise.resolve([
      { kind: 'audioinput', deviceId: 'default', label: 'Default' },
      { kind: 'audioinput', deviceId: 'interface', label: 'Guitar interface' },
      { kind: 'videoinput', deviceId: 'camera', label: 'Camera' },
    ])
  );
  const media = Object.assign(new EventTarget(), { getUserMedia, enumerateDevices });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: media });
  return media;
}

describe('audio device selection', () => {
  it('restores the selected device and renders useful notices and named choices', async () => {
    const media = devices();
    media.enumerateDevices.mockResolvedValue([
      { kind: 'audioinput', deviceId: 'default', label: 'Default' },
      { kind: 'audioinput', deviceId: 'blank', label: '   ' },
      { kind: 'audioinput', deviceId: 'interface', label: 'Guitar interface' },
      { kind: 'videoinput', deviceId: 'camera', label: 'Camera' },
    ]);
    localStorage.setItem('audio-input-device', JSON.stringify('interface'));
    document.body.innerHTML =
      audioInputPanelHtml('one') + audioInputPanelHtml('two', 'Choose your guitar input.');
    initAudioInputControls();
    await settle();
    expect((element('#oneAudioInput') as HTMLSelectElement).value).toBe('interface');
    expect((element('#twoAudioInput') as HTMLSelectElement).value).toBe('interface');
    expect(document.body.innerHTML).toMatchSnapshot('restored audio devices');
    change('#twoAudioInput', '');
    expect((element('#oneAudioInput') as HTMLSelectElement).value).toBe('');
    expect(getSelectedAudioInputId()).toBeNull();
    expect(document.body.innerHTML).toMatchSnapshot('default audio device selected');
  });
  it('keeps permission guidance visible when the browser has no media-device API', async () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    document.body.innerHTML = audioInputPanelHtml('unsupported');
    initAudioInputControls();
    await settle();
    expect(document.body.innerHTML).toMatchSnapshot('unsupported audio input');
    expect((element('#unsupportedAudioInput') as HTMLSelectElement).disabled).toBe(true);
  });

  it('lists named microphones, synchronizes selectors and persists selections', async () => {
    const media = devices();
    document.body.innerHTML = audioInputPanelHtml('one') + audioInputPanelHtml('two');
    expect(createAudioInputPanel('third').querySelector('select')?.id).toBe('thirdAudioInput');
    expect(getSelectedAudioInputId()).toBeNull();
    initAudioInputControls();
    await settle();
    expect(
      [...(element('#oneAudioInput') as HTMLSelectElement).options].map((option) => [
        option.value,
        option.textContent,
      ])
    ).toEqual([
      ['', 'System default'],
      ['interface', 'Guitar interface'],
    ]);
    expect((element('#oneAudioInput') as HTMLSelectElement).disabled).toBe(false);
    const changed = vi.fn();
    window.addEventListener(AUDIO_INPUT_CHANGED_EVENT, changed);
    change('#oneAudioInput', 'interface');
    expect(getSelectedAudioInputId()).toBe('interface');
    expect((element('#twoAudioInput') as HTMLSelectElement).value).toBe('interface');
    expect(changed).toHaveBeenCalledOnce();
    clearSelectedAudioInput();
    expect(getSelectedAudioInputId()).toBeNull();
    media.enumerateDevices.mockResolvedValueOnce([
      { kind: 'audioinput', deviceId: 'interface', label: '' },
    ]);
    media.dispatchEvent(new Event('devicechange'));
    await settle();
    expect((element('#oneAudioInput') as HTMLSelectElement).disabled).toBe(true);
    expect(element('[data-audio-input-help]').hidden).toBe(false);
    media.enumerateDevices.mockRejectedValueOnce(new Error('denied'));
    notifyAudioInputsAvailable();
    await settle();
    expect((element('#oneAudioInput') as HTMLSelectElement).disabled).toBe(true);
    change('#oneAudioInput', '');
    expect(getSelectedAudioInputId()).toBeNull();
  });
  it('requests raw audio and falls back only when a selected device disappeared', async () => {
    const media = devices();
    localStorage.setItem('audio-input-device', JSON.stringify('interface'));
    media.getUserMedia.mockRejectedValueOnce(new DOMException('disconnected', 'NotFoundError'));
    expect(await acquireMic()).toEqual({ id: 'stream' });
    expect(media.getUserMedia.mock.calls).toEqual([
      [
        {
          audio: {
            deviceId: { exact: 'interface' },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        },
      ],
      [{ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }],
    ]);
    expect(getSelectedAudioInputId()).toBeNull();
    media.getUserMedia.mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'));
    await expect(acquireMic()).rejects.toThrow('blocked');
    expect(media.getUserMedia).toHaveBeenCalledTimes(3);
  });
  it('does not retry an unselected missing microphone', async () => {
    const media = devices();
    media.getUserMedia.mockRejectedValueOnce(new DOMException('none', 'NotFoundError'));
    await expect(acquireMic()).rejects.toThrow('none');
    expect(media.getUserMedia).toHaveBeenCalledOnce();
  });
});

describe('microphone listener lifecycle', () => {
  it('gates silence and attack transients, smooths pitch, snaps semitones and releases resources', async () => {
    const audio = audioHarness();
    const stop = vi.fn();
    const media = devices(vi.fn(() => Promise.resolve({ getTracks: () => [{ stop }] })) as never);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const detect = vi.spyOn(pitch, 'detectPitch').mockReturnValue(437);
    const callbacks = {
      onNote: vi.fn<(note: null | { name: string }) => void>(),
      onStart: vi.fn(),
      onStop: vi.fn(),
      onError: vi.fn(),
    };
    const listener = createAudioListener(callbacks);
    expect(listener.isListening()).toBe(false);
    await listener.start();
    expect(listener.isListening()).toBe(true);
    expect(callbacks.onStart).toHaveBeenCalledOnce();
    expect(callbacks.onNote).toHaveBeenLastCalledWith(null);
    const analyser = audio.analysers[0];
    expect(analyser).toBeDefined();
    analyser?.getFloatTimeDomainData.mockImplementation((buffer: Float32Array) => buffer.fill(0.1));
    now = 1;
    frame(now);
    now = 80;
    frame(now);
    expect(detect).not.toHaveBeenCalled();
    now = 81;
    frame(now);
    expect(callbacks.onNote).toHaveBeenLastCalledWith({
      name: 'A',
      noteIndex: 0,
      midiNote: 69,
      centsOff: -12,
    });
    detect.mockReturnValue(443);
    now = 100;
    frame(now);
    expect(callbacks.onNote).toHaveBeenLastCalledWith({
      name: 'A',
      noteIndex: 0,
      midiNote: 69,
      centsOff: -8,
    });
    detect.mockReturnValue(493.883301);
    now = 120;
    frame(now);
    expect(callbacks.onNote.mock.lastCall?.[0]?.name).toBe('B');
    detect.mockReturnValue(null);
    frame(140);
    expect(callbacks.onNote).toHaveBeenLastCalledWith(null);
    listener.stop();
    expect(listener.isListening()).toBe(false);
    expect(stop).toHaveBeenCalledOnce();
    expect(audio.context.close).toHaveBeenCalledOnce();
    expect(callbacks.onStop).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event(AUDIO_INPUT_CHANGED_EVENT));
    await settle();
    expect(media.getUserMedia).toHaveBeenCalledOnce();
  });
  it('restarts an active listener on input changes and reports acquisition errors', async () => {
    audioHarness();
    const media = devices(vi.fn(() => Promise.resolve({ getTracks: () => [] })) as never);
    const onError = vi.fn();
    const listener = createAudioListener({ onNote: vi.fn(), onError });
    await listener.start();
    window.dispatchEvent(new Event(AUDIO_INPUT_CHANGED_EVENT));
    await settle();
    expect(media.getUserMedia).toHaveBeenCalledTimes(2);
    media.getUserMedia.mockRejectedValueOnce(new Error('gone'));
    window.dispatchEvent(new Event(AUDIO_INPUT_CHANGED_EVENT));
    await settle();
    expect(onError).toHaveBeenCalledOnce();
    expect(listener.isListening()).toBe(false);
    listener.stop();
  });
});
