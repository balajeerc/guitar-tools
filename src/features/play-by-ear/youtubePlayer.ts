interface YouTubePlayerEvent {
  data: number;
}

interface YouTubePlayer {
  cueVideoById(options: VideoOptions): void;
  loadVideoById(options: VideoOptions): void;
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
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
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
  pause: () => void;
  destroy: () => void;
}

interface PlayerCallbacks {
  onPlaying: () => void;
  onPaused: () => void;
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
          if (event.data === api.PlayerState.ENDED && looping) instance.loadVideoById(activeSection);
          else if (event.data === api.PlayerState.PLAYING) callbacks.onPlaying();
          else if (event.data === api.PlayerState.PAUSED) callbacks.onPaused();
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
    pause(): void {
      looping = false;
      player.pauseVideo();
    },
    destroy(): void {
      player.destroy();
    },
  };
}
