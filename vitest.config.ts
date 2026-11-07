import { defineConfig } from 'vitest/config';

import testedSources from './test-scope.json';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    environment: 'jsdom',
    // Bound each VM worker during long mutation runs; ordinary forks ignore this.
    vmMemoryLimit: '512MB',
    testTimeout: 30_000,
    setupFiles: ['src/__fixtures__/browser.ts'],
    fakeTimers: {
      toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: testedSources,
      exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
