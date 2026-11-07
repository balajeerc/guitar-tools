import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

function repositoryRoot(start: string): string {
  let directory = start;
  while (!existsSync(join(directory, '.git'))) {
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Cannot find repository root');
    directory = parent;
  }
  return directory;
}

// Stryker runs from a sandbox inside this repository. The rule mirrors live
// at the real root and are deliberately omitted from its sandbox copy.
const root = repositoryRoot(process.cwd());
function read(file: string): string {
  return readFileSync(join(root, file), 'utf8');
}

interface Probe {
  file: string;
  pattern: RegExp;
  perUnit?: number;
}
function lintCap(rule: string): Probe {
  return {
    file: 'eslint.config.js',
    pattern: new RegExp(`(?:'${rule}'|${rule})\\s*:[^\\]]*?max:\\s*(\\d+)`),
  };
}
const probes: Record<string, Probe> = {
  complexity: lintCap('complexity'),
  'max-depth': lintCap('max-depth'),
  'max-lines': lintCap('max-lines'),
  'max-lines-per-function': lintCap('max-lines-per-function'),
  'max-params': lintCap('max-params'),
  'max-statements': lintCap('max-statements'),
  'coverage.thresholds': { file: 'vitest.config.ts', pattern: /statements:\s*(\d+)/ },
  'thresholds.break': { file: 'stryker.conf.mjs', pattern: /break:\s*(\d+)/ },
  printWidth: { file: '.prettierrc', pattern: /"printWidth":\s*(\d+)/ },
  minimumReleaseAge: {
    file: 'pnpm-workspace.yaml',
    pattern: /minimumReleaseAge:\s*(\d+)/,
    perUnit: 1440,
  },
};

describe('quality policy drift guards', () => {
  it('keeps every documented limit aligned with the configuration that enforces it', () => {
    const rows = [
      ...read('agent_rules/03_quality_checks.md').matchAll(/^\|\s*`([^`]+)`\s*\|\s*(\d+)\s*\|/gm),
    ];
    const documented = new Map(rows.map((row) => [row[1] ?? '', Number(row[2])]));
    expect([...documented.keys()].sort((a, b) => a.localeCompare(b))).toEqual(
      Object.keys(probes).sort((a, b) => a.localeCompare(b))
    );
    const actual = Object.fromEntries(
      Object.entries(probes).map(([name, probe]) => {
        const match = probe.pattern.exec(read(probe.file));
        return [name, Number(match?.[1]) / (probe.perUnit ?? 1)];
      })
    );
    expect(actual).toEqual(Object.fromEntries(documented));
  });
  it('keeps coverage and mutation testing on the whole application', () => {
    const scope: unknown = JSON.parse(read('test-scope.json'));
    expect(scope).toEqual(['src/**/*.ts', 'public/sw.js']);
    expect(read('vitest.config.ts')).toContain('include: testedSources');
    expect(read('stryker.conf.mjs')).toContain('...testedSources');
    expect(read('vitest.config.ts')).toContain(
      "exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**']"
    );
    expect(read('stryker.conf.mjs')).toContain("'!src/**/*.test.ts'");
    expect(read('stryker.conf.mjs')).toContain("'!src/**/__fixtures__/**'");
  });
  it('links every agent rule and serves the same rules through both mirrors', () => {
    const rules = readdirSync(join(root, 'agent_rules'))
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));
    const links = [...read('AGENTS.md').matchAll(/agent_rules\/([\w.]+\.md)/g)]
      .map((match) => match[1] ?? '')
      .sort((a, b) => a.localeCompare(b));
    expect(links).toEqual(rules);
    expect(rules.map((file) => read(`.claude/rules/${file}`))).toEqual(
      rules.map((file) => read(`agent_rules/${file}`))
    );
    expect(rules.map((file) => read(`.kilocode/rules/${file}`))).toEqual(
      rules.map((file) => read(`agent_rules/${file}`))
    );
  });
});
