const PLAY_BY_EAR_ROUTE = "play-by-ear";

function routeParts(hash: string): readonly string[] {
  return hash.replace(/^#/, "").split("/");
}

export function isPlayByEarRoute(hash = window.location.hash): boolean {
  return routeParts(hash)[0] === PLAY_BY_EAR_ROUTE;
}

export function playByEarSongId(hash = window.location.hash): string | null {
  const [route, songId] = routeParts(hash);
  return route === PLAY_BY_EAR_ROUTE && songId ? songId : null;
}

export function setPlayByEarSongUrl(songId: string): void {
  const hash = `#${PLAY_BY_EAR_ROUTE}/${songId}`;
  if (window.location.hash !== hash) window.location.hash = hash;
}

export function replacePlayByEarSongUrl(songId: string): void {
  window.history.replaceState(null, "", `#${PLAY_BY_EAR_ROUTE}/${songId}`);
}
