import type { createAudioListener } from '../shared/audioListener';

export type AudioListenerCallbacks = Parameters<typeof createAudioListener>[0];
