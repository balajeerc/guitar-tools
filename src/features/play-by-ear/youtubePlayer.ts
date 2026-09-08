interface YouTubePlayerEvent {
  data: number;
}

interface YouTubePlayer {
  cueVideoById(options: VideoOptions): void;
  loadVideoById(options: VideoOptions): void;
  getAvailablePlaybackRates(): number[];
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  pauseVideo(): void;
  destroy(): void;
}

interface VideoOptions {
  videoId: string;
  startSeconds: number;
  endSeconds: number;
}

interface YouTubeApi {
  Player: new (elementId: string, options: Record<string, unknown>) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; CUED: number };
}

type YouTubeWindow = Window & typeof globalThis & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

export interface YouTubeSection {
  videoId: string;
  startSeconds: number;
  endSeconds: number;
}

export interface YouTubeSectionPlayer {
  cue: (section: YouTubeSection) => void;
  playLoop: (section: YouTubeSection) => void;
  getAvailablePlaybackRates: () => readonly number[];
  getPlaybackRate: () => number;
  setPlaybackRate: (rate: number) => void;
  pause: () => void;
  destroy: () => void;
}

interface PlayerCallbacks {
  onPlaying: () => void;
  onPaused: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onError: (message: string) => void;
}

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  const youtubeWindow = window as YouTubeWindow;
  if (youtubeWindow.YT?.Player) return Promise.resolve(youtubeWindow.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    youtubeWindow.onYouTubeIframeAPIReady = (): void => {
      previousReady?.();
      if (youtubeWindow.YT) resolve(youtubeWindow.YT);
      else reject(new Error("YouTube player API did not load"));
    };
    window.setTimeout(() => reject(new Error("YouTube player API is unavailable")), 15_000);
  });
  return apiPromise;
}

function playerErrorMessage(code: number): string {
  if (code === 100) return "This video has been removed or made private.";
  if (code === 101 || code === 150) return "This video does not allow embedded playback.";
  if (code === 153) return "YouTube could not identify this embedded player.";
  return "This video could not be played here.";
}

export async function createYouTubeSectionPlayer(
  elementId: string,
  initialSection: YouTubeSection,
  callbacks: PlayerCallbacks,
): Promise<YouTubeSectionPlayer> {
  const api = await loadYouTubeApi();
  let activeSection = initialSection;
  let looping = false;
  let desiredPlaybackRate = 1;

  function restorePlaybackRate(instance: YouTubePlayer): void {
    if (instance.getPlaybackRate() !== desiredPlaybackRate) {
      instance.setPlaybackRate(desiredPlaybackRate);
    }
  }

  const player = await new Promise<YouTubePlayer>((resolve) => {
    const instance = new api.Player(elementId, {
      width: "100%",
      height: "100%",
      videoId: initialSection.videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (): void => resolve(instance),
        onStateChange: (event: YouTubePlayerEvent): void => {
          switch (event.data) {
            case api.PlayerState.ENDED:
              if (looping) instance.loadVideoById(activeSection);
              break;
            case api.PlayerState.PLAYING:
              restorePlaybackRate(instance);
              callbacks.onPlaying();
              break;
            case api.PlayerState.CUED:
              restorePlaybackRate(instance);
              break;
            case api.PlayerState.PAUSED:
              callbacks.onPaused();
              break;
          }
        },
        onPlaybackRateChange: (event: YouTubePlayerEvent): void => {
          callbacks.onPlaybackRateChange(event.data);
        },
        onError: (event: YouTubePlayerEvent): void => callbacks.onError(playerErrorMessage(event.data)),
      },
    });
  });

  return {
    cue(section): void {
      activeSection = section;
      looping = false;
      player.cueVideoById(section);
    },
    playLoop(section): void {
      activeSection = section;
      looping = true;
      player.loadVideoById(section);
    },
    getAvailablePlaybackRates(): readonly number[] {
      return player.getAvailablePlaybackRates();
    },
    getPlaybackRate(): number {
      return player.getPlaybackRate();
    },
    setPlaybackRate(rate): void {
      desiredPlaybackRate = rate;
      player.setPlaybackRate(rate);
    },
    pause(): void {
      looping = false;
      player.pauseVideo();
    },
    destroy(): void {
      player.destroy();
    },
  };
}
