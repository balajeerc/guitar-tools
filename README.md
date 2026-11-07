# B's Guitar Tools

A browser-based toolkit for learning the guitar fretboard, exploring music theory, training your ear, and practicing rhythm. Built with TypeScript, CSS, and Vite.

[Open B's Guitar Tools](https://balajeerc.github.io/guitar-tools/)

## Features

- **Scales and triads:** explore major and minor scales, pentatonic positions, CAGED shapes, and triad inversions with note or interval labels.
- **Fretboard exploration:** discover notes across the neck and use Fret Walk to follow scales from a chosen root through successive octaves.
- **Circle of fifths:** explore keys, scale degrees, and chord relationships.
- **Ear training:** hear a mystery melody and play it back, use the ear trainer to identify short phrases as scale degrees, or loop phrases from curated YouTube performances in Play by Ear. You can also enter intervals manually.
- **Listener and tuner:** identify played notes and their scale degrees, or tune a guitar in standard tuning using live pitch detection.
- **Rhythm practice:** use the metronome and drum loops for accompaniment.

The app includes light and dark themes, mobile layouts, and an installable progressive web app.

## Run locally

Use Node.js 22.18+ or 24.11+ and pnpm 10.28.2 (the version pinned in `package.json`).

```sh
git clone https://github.com/balajeerc/guitar-tools.git
cd guitar-tools
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open [http://localhost:19090](http://localhost:19090). The development script uses `fuser` to free port 19090 before starting Vite. If `fuser` is unavailable, run `pnpm exec vite` instead.

No backend, API keys, or environment variables are required.

## Audio and browser requirements

Use a modern browser with Web Audio and microphone support. Listening features need permission to access your microphone or audio interface, and require HTTPS or `localhost`.

The metronome, drum loops, and active microphone tools automatically request that the screen stay awake. This requires Screen Wake Lock support and HTTPS or `localhost`. The request is released when the tool stops and renewed when you return to the app. Your browser or device may decline it, for example in power-saving mode.

For reliable pitch detection, use an audio interface when possible, play clean single notes, and keep background noise low. The detector follows one pitch at a time. The fretboard and tuner assume standard six-string guitar tuning (E–A–D–G–B–E).

Audio input is processed in the browser, and preferences are stored locally in your browser. YouTube performances require an internet connection; the videos remain hosted on YouTube.

## Development

```sh
pnpm check    # Types, format, lint, unused code, duplication, dependencies, and coverage
pnpm build    # Production assets in dist/
pnpm preview  # Preview the production build locally
```

Run `pnpm check` before submitting changes. After installing with scripts disabled, enable the Git hooks and install the pinned secret scanner:

```sh
pnpm hooks:install
pnpm tools:install
```

The pre-commit hook runs `pnpm check`. The commit-message hook enforces Conventional Commits, for example `chore: add quality checks`. The pre-push hook scans Git history for secrets, audits dependencies at moderate severity or higher, builds the app, and runs mutation tests. These are local hooks; this repository has no CI workflow.

```sh
pnpm fix                    # ESLint autofixes and Prettier formatting
pnpm test:watch             # Watch unit tests
pnpm test:coverage          # Run tests and enforce coverage
pnpm test:mutation          # Check that tests catch changes to source behavior
pnpm check:vulnerabilities  # Audit installed dependencies
pnpm scan:secrets           # Scan Git history with gitleaks
```

The test gate covers every TypeScript source module and the offline service worker matched by `test-scope.json`, excluding tests and test fixtures. Coverage must meet 80% for statements, branches, functions, and lines; mutation score must meet 90%. Both coverage and mutation testing read that same source list.

Prettier enforces 100-column formatting. pnpm refuses dependencies newer than 30 days and publisher-trust downgrades; those settings live in `pnpm-workspace.yaml`. Exact-version age exceptions cover the Stryker/Vitest compatibility fix and audited security patches documented in the quality rules.

The app is a static site. Navigation uses URL hashes. The production build registers a service worker; development mode disables it to keep cached assets from hiding changes.

## Deployment

GitHub Pages publishes the built site from the root of the `gh-pages` branch. In repository Settings → Pages, the source is **Deploy from a branch**, using **gh-pages / (root)**.

To publish a release, use an authenticated GitHub CLI with repository write access:

```sh
./deploy.sh
```

The script checks the code, builds for the `/guitar-tools/` path, and pushes the assets and license to `gh-pages`. Source code stays on `master`.

The Pages entry URL is **https://balajeerc.github.io/guitar-tools/**. GitHub currently redirects it to **https://www.balajeerc.info/guitar-tools/** because this account's main Pages site uses a custom domain.

To preview the Pages build locally:

```sh
pnpm build --base /guitar-tools/
pnpm preview --base /guitar-tools/
```

Open the preview server's `/guitar-tools/` path. A plain `pnpm build` still creates a build for hosting at a domain's root.

## Project layout

```text
index.html       App shell and navigation
src/features/    Practice tools and their UI, theory, and playback logic
src/shared/      Fretboard rendering, audio input, music theory, and preferences
src/pwa/         Install prompt and service worker registration
src/style.css    Styles and themes
public/          Icons, manifest, and service worker
```

## Contributing

Bug reports and pull requests are welcome. For audio issues, include your browser, operating system, input device, and steps to reproduce the problem.

## License

[MIT](LICENSE). You may use, modify, and distribute the software, including commercially, provided you retain the copyright and license notice. Linked YouTube performances remain subject to their respective owners' rights.
