import { describe, expect, it, vi } from 'vitest';

const tiers = [
  {
    difficulty: 'easy',
    load: async () => {
      const catalog = await import('./easyCatalog');
      return catalog.EASY_MELODIES;
    },
  },
  {
    difficulty: 'medium',
    load: async () => {
      const catalog = await import('./mediumCatalog');
      return catalog.MEDIUM_MELODIES;
    },
  },
  {
    difficulty: 'hard',
    load: async () => {
      const catalog = await import('./hardCatalog');
      return catalog.HARD_MELODIES;
    },
  },
] as const;

describe('curated melody library', () => {
  it.each(tiers)(
    'preserves the $difficulty tunes, note durations and interval answers',
    async ({ difficulty, load }) => {
      // Catalogue expressions run during import. Load them in the active test
      // so mutation testing attributes and applies those data mutations here.
      vi.resetModules();
      const melodies = await load();
      expect(melodies.length).toBeGreaterThan(0);
      expect(new Set(melodies.map((melody) => melody.id)).size).toBe(melodies.length);
      expect(melodies.every((melody) => melody.difficulty === difficulty)).toBe(true);
      expect(melodies.every((melody) => melody.notes.length === melody.degrees.length)).toBe(true);
      expect(melodies).toMatchSnapshot();
    }
  );
});
