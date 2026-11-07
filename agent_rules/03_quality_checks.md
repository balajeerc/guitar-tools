# Quality checks

Ported from `balajeerc/ts-agentic-template` at commit `4da95c2e8fba2e9870a954a838fda27be036c731`.

- `pnpm check` runs type checking, Prettier, ESLint, both Knip modes, duplication checks, dependency rules, and tests with coverage.
- `pnpm hooks:install` enables pre-commit, commit-msg, and pre-push hooks after installing with scripts disabled.
- `pnpm tools:install` downloads gitleaks 8.30.1 and verifies the pinned SHA-256 checksum.
- Pre-push runs secret scanning, the moderate-severity dependency audit, the production build, and Stryker mutation testing.
- Stryker checks each mutation against the strict TypeScript configuration before running its tests.
- Vitest 5 needs Stryker 10.1 or newer because its test-name separator changed; verify upgrades with a known failing mutation before a full run.
- jsdom and deterministic browser/audio fixtures keep the app-wide suite hermetic.
- No hosted CI workflow is included in either repository.
- `.claude/hooks/format-edited-file.sh` applies ESLint fixes and Prettier after edits through Claude.

## Browser adaptations

- Keep Vite's browser build, globals, and service worker. Remove unused React lint plugins from this vanilla TypeScript app.
- Apply Node API rules to configuration files, rather than browser source.
- Allow numeric and boolean template interpolation for HTML and SVG.
- Allow `console.error` for recoverable browser failures; other console methods fail lint.
- Keep the existing larger catalog-file limit for declarative song data.
- Keep pnpm 10. Stryker's Babel 8 dependency requires Node 22.18+ or 24.11+; the package engine range matches that requirement.
- Exact release-age exceptions for Stryker 10.1.1, qs 6.16.1, zod 4.6.6, fast-uri 3.1.9, and minimatch 11.0.1 are approved for compatibility and security fixes. Keep publisher-trust checks and auditing enabled. The minimatch override crosses a major version, so validate linting, file selection, and mutation testing when updating it.
- The minimatch fix's helper dependency is pinned to `@isaacs/nonrecursive-glob-match@1.0.1` with its own exact age exception, avoiding newer helper releases.
- `test-scope.json` includes every TypeScript source module and `public/sw.js`. Coverage and mutation testing exclude only tests and test fixtures.
- The template's environment, logger, and code-walkthrough guards are specific to its Node app. Here, drift guards check agent-rule links, thresholds, and shared test scope.

## Enforced limits

| Setting                  | Value | Configuration         |
| ------------------------ | ----- | --------------------- |
| `max-lines-per-function` | 120   | `eslint.config.js`    |
| `max-lines`              | 500   | `eslint.config.js`    |
| `complexity`             | 10    | `eslint.config.js`    |
| `max-depth`              | 3     | `eslint.config.js`    |
| `max-params`             | 5     | `eslint.config.js`    |
| `max-statements`         | 70    | `eslint.config.js`    |
| `coverage.thresholds`    | 80    | `vitest.config.ts`    |
| `thresholds.break`       | 90    | `stryker.conf.mjs`    |
| `printWidth`             | 100   | `.prettierrc`         |
| `minimumReleaseAge`      | 30    | `pnpm-workspace.yaml` |

Change the table and the configuration together. Drift guards enforce agreement.
