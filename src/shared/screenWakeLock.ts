/** Keep the screen awake only while a practice tool is active. */
export function createScreenWakeLock(): { start: () => void; stop: () => void } {
  let active = false;
  let requesting = false;
  let sentinel: WakeLockSentinel | null = null;

  async function release(lock: WakeLockSentinel): Promise<void> {
    try {
      await lock.release();
    } catch {
      // The browser may already have discarded the lock.
    }
  }

  async function request(): Promise<void> {
    if (!active || requesting || sentinel || document.visibilityState !== "visible") return;
    if (!("wakeLock" in navigator)) return;
    requesting = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!active || document.visibilityState !== "visible") {
        await release(lock);
        return;
      }
      sentinel = lock;
      lock.addEventListener("release", () => {
        if (sentinel === lock) sentinel = null;
      }, { once: true });
    } catch {
      // Unsupported devices, power saving, or permissions must not interrupt audio.
    } finally {
      requesting = false;
    }
  }

  function onVisibilityChange(): void {
    void request();
  }

  function start(): void {
    active = true;
    document.addEventListener("visibilitychange", onVisibilityChange);
    void request();
  }

  function stop(): void {
    active = false;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    const lock = sentinel;
    sentinel = null;
    if (lock) void release(lock);
  }

  return { start, stop };
}
