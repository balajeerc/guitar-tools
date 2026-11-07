import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

/*
 * Line length is NOT enforced here. `eslint-config-prettier` is last in the
 * export and switches `max-len` off, so any cap set here would be dead config
 * that reads as enforced. Prettier's `printWidth` in `.prettierrc` is the one
 * real setting, and `pnpm check:format` is what enforces it.
 */

// Browser configuration belongs in Vite's import.meta.env.
const processEnvSelector = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message: 'Use Vite import.meta.env for browser configuration.',
};

// Left behind by an agent, `it.only` silently disables the rest of the suite;
// `it.skip` rots in place. Neither is ever right to commit.
const focusedTestSelector = {
  selector:
    'CallExpression[callee.object.name=/^(it|test|describe|suite|context)$/][callee.property.name=/^(only|skip)$/]',
  message: 'Remove .only()/.skip() before committing.',
};

const sharedPlugins = {
  '@typescript-eslint': tseslint.plugin,
  sonarjs: sonarjs,
  unicorn: unicorn,
  perfectionist: perfectionist,
  promise: pluginPromise,
};

const sharedTypeScriptRules = {
  ...sonarjs.configs.recommended.rules,
  ...pluginPromise.configs.recommended.rules,

  // Deterministic ordering, curated. Import/export/type-member order is what
  // makes an agent's output diff-reviewable — the same import set should always
  // sort the same way regardless of which agent (or which day) wrote it.
  //
  // Object-literal and class-member order is often *meaningful* (a config
  // builder reads top to bottom, a class body is written in an intentional
  // order), so perfectionist's `sort-objects` / `sort-maps` / `sort-classes`
  // and friends are deliberately left off. Sorting those fights the author.
  'perfectionist/sort-imports': [
    'error',
    {
      type: 'natural',
      internalPattern: ['^@/'],
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type', 'unknown'],
      ignoreCase: true,
    },
  ],
  'perfectionist/sort-named-imports': ['error', { type: 'natural', ignoreAlias: false }],
  'perfectionist/sort-named-exports': ['error', { type: 'natural' }],
  'perfectionist/sort-exports': ['error', { type: 'natural' }],
  'perfectionist/sort-union-types': ['error', { type: 'natural' }],
  'perfectionist/sort-intersection-types': ['error', { type: 'natural' }],
  'perfectionist/sort-object-types': ['error', { type: 'natural' }],
  'perfectionist/sort-heritage-clauses': ['error', { type: 'natural' }],
  'perfectionist/sort-interfaces': ['error', { type: 'natural' }],

  // `.then` chains are harder to read, reason about and error-handle than
  // `await`. Core rules already ban async executors; this bans the rest.
  'promise/prefer-await-to-then': 'error',
  'no-promise-executor-return': 'error',

  // Enforce browser configuration access and reject focused or skipped tests.
  'no-restricted-syntax': ['error', processEnvSelector, focusedTestSelector],

  // Unicorn recommended rules (selected for readability)
  'unicorn/better-regex': 'error',
  'unicorn/catch-error-name': 'error',
  'unicorn/consistent-destructuring': 'warn',
  'unicorn/consistent-function-scoping': 'error',
  'unicorn/custom-error-definition': 'error',
  'unicorn/error-message': 'error',
  'unicorn/escape-case': 'error',
  /*
   * Deferred work has to carry an expiry date. `allowWarningComments: false` is
   * what makes an undated marker an error rather than something the rule shrugs
   * at; on the date it names, the build fails and someone decides again, which
   * is the entire point of writing one down.
   *
   * The sonarjs equivalent is switched off below. The two cannot both be
   * satisfied: sonarjs rejects the marker outright, so no form of the comment
   * passes and the only ways through are deleting the note or disabling the
   * rule. Neither leaves a record.
   *
   * The required form is spelled out under "Deferred work" in
   * `agent_rules/02_coding_guidelines.md`. It is written there rather than here
   * because this rule reads comments, and a comment demonstrating the marker
   * would itself be an undated marker.
   */
  'unicorn/expiring-todo-comments': ['error', { allowWarningComments: false }],
  'unicorn/explicit-length-check': 'error',
  'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^[A-Z].*\\.tsx?$'] }],
  'unicorn/no-abusive-eslint-disable': 'error',
  'unicorn/no-array-for-each': 'warn',
  'unicorn/no-array-push-push': 'error',
  'unicorn/no-await-expression-member': 'error',
  'unicorn/no-console-spaces': 'error',
  'unicorn/no-for-loop': 'warn',
  'unicorn/no-lonely-if': 'error',
  'unicorn/no-nested-ternary': 'warn',
  'unicorn/no-null': 'off',
  'unicorn/no-useless-undefined': 'error',
  'unicorn/number-literal-case': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-array-flat-map': 'error',
  'unicorn/prefer-array-some': 'error',
  'unicorn/prefer-date-now': 'error',
  'unicorn/prefer-default-parameters': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicorn/prefer-negative-index': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
  'unicorn/prefer-optional-catch-binding': 'error',
  'unicorn/prefer-spread': 'error',
  'unicorn/prefer-string-starts-ends-with': 'error',
  'unicorn/prefer-switch': 'warn',
  'unicorn/prefer-ternary': 'warn',
  'unicorn/prefer-type-error': 'error',
  'unicorn/throw-new-error': 'error',

  // SonarJS rule adjustments
  'sonarjs/redundant-type-aliases': 'off', // Type aliases provide semantic meaning
  // The unicorn rule above dates the marker; this one bans it outright. Only
  // one of the two can be on.
  'sonarjs/todo-tag': 'off',
  'sonarjs/cognitive-complexity': 'error',
  'sonarjs/no-nested-functions': 'error',

  // TypeScript rules not already covered by strict-type-checked
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      varsIgnorePattern: '^[A-Z_]',
      argsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  // Numeric and boolean interpolations are common in DOM attributes and SVG.
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    { allowNumber: true, allowBoolean: true },
  ],
  // Adding a variant to a discriminated union becomes a compile-time failure at
  // every switch over it, rather than a silent fallthrough at runtime.
  '@typescript-eslint/switch-exhaustiveness-check': [
    'error',
    { considerDefaultExhaustiveForUnions: true },
  ],
  // Type-only imports are erased predictably under `isolatedModules`.
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
  ],

  // Keep browser diagnostics for recoverable storage and service-worker errors.
  'no-console': ['error', { allow: ['error'] }],

  // Complexity rules
  complexity: ['error', { max: 10 }],
  'max-depth': ['error', { max: 3 }],
  'max-nested-callbacks': ['error', { max: 3 }],
  'max-params': ['error', { max: 5 }],
  'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],

  /*
   * The cap that matters, and the one stated in `agent_rules/02`: refactor a
   * function over 120 lines. It is expressed in lines rather than statements on
   * purpose — that is the unit the guideline uses, so it is the unit someone can
   * act on when the rule fires.
   */
  'max-lines-per-function': ['error', { max: 120, skipBlankLines: true, skipComments: true }],

  /*
   * A backstop for the pathological case, deliberately far out at 70.
   *
   * This is the only size rule that fires on code which is long but NOT complex
   * — a flat sequence of assignments in a config builder or a wiring function
   * has cyclomatic complexity 1 and trips nothing else. Tightening it pushes
   * toward single-use helpers that scatter a linear narrative across files,
   * which reads worse than the long version. `complexity`,
   * `sonarjs/cognitive-complexity` and `max-lines-per-function` are what do the
   * real work here.
   */
  'max-statements': ['error', { max: 70 }, { ignoreTopLevelFunctions: false }],
};

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'reports', '.stryker-tmp', '.tools'],
  },
  // TypeScript sources. `**/*.ts` rather than a src/scripts allowlist so that a
  // root-level config file (vitest.config.ts) is linted too, and `projectService`
  // rather than a fixed `project` so a new file is type-checked without anyone
  // remembering to widen a glob.
  //
  // `tseslint.config()` (the `typescript-eslint` meta-package) replaces the old
  // hand-assembled plugin + parser + `configs['eslint-recommended'].overrides[0]`
  // wiring. `strictTypeChecked` already bundles the base setup and the
  // eslint-recommended turn-offs, so there is no internal array index to break
  // on a dependency bump.
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { ...sharedPlugins },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: { ...sharedTypeScriptRules },
  },
  {
    files: ['*.config.ts', '**/*.test.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/features/play-by-ear/catalog.ts'],
    rules: {
      // Curated song records are declarative data.
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
    },
  },
  /*
   * Tests. Two things happen here: the production rules that only cost noise in
   * a test file are switched off, and `@vitest/eslint-plugin` is switched on.
   *
   * The plugin is the part that matters. A test file is the one place where
   * broken code still reports success — `it.only` quietly parks the rest of the
   * suite, a body with no `expect` passes by construction, an `expect` behind an
   * `if` asserts nothing on the other branch. None of that shows up in a test
   * run, a coverage number or a diff review; all of it shows up here.
   *
   */
  {
    files: ['**/*.test.ts', '**/*.integration.test.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,

      // Recommended has this at 'warn'. `--max-warnings=0` makes that fatal
      // anyway, so say what is meant.
      'vitest/no-disabled-tests': 'error',

      // A branch inside a test means the assertions taken depend on the data,
      // and the path that asserts nothing is the one that will be taken on the
      // day it matters. Branch in the fixture, not in the test.
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-conditional-tests': 'error',

      // `expect` inside a loop or a callback may simply never execute; an
      // explicit count is what turns that into a failure rather than a pass.
      // Straight-line tests are left alone.
      'vitest/prefer-expect-assertions': [
        'error',
        { onlyFunctionsWithExpectInCallback: true, onlyFunctionsWithExpectInLoop: true },
      ],

      // A returned promise is not an awaited promise: the test ends before the
      // assertion resolves and the failure lands in the next test, or nowhere.
      'vitest/no-test-return-statement': 'error',

      // Structure and naming, so a suite reads the same whoever wrote it.
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/require-top-level-describe': 'error',
      'vitest/prefer-importing-vitest-globals': 'error',
      'vitest/no-alias-methods': 'error',
      'vitest/prefer-to-be': 'error',

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-nested-callbacks': ['error', { max: 5 }],
      'sonarjs/no-duplicate-string': 'off',
      // A `describe` block is itself a function, so this counts the whole suite
      // as one body. `max-lines` still caps the file at 500.
      'max-lines-per-function': 'off',
      // `vitest/no-focused-tests` and `vitest/no-disabled-tests` above cover
      // this ground properly here — they understand `describe.only`,
      // `it.each(...).only` and the placeholder forms, which a syntax selector
      // does not. The
      // selector stays on everywhere else as a backstop; the `process.env` ban
      // applies to tests exactly as it does to production code.
      'no-restricted-syntax': ['error', processEnvSelector],
    },
  },
  // Plain JS / config files — no type-aware rules, so no project service needed.
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      sonarjs: sonarjs,
      unicorn: unicorn,
      n: pluginN,
      promise: pluginPromise,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...pluginPromise.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      'n/no-deprecated-api': 'error',
      'n/no-exports-assign': 'error',
      'n/no-process-exit': 'error',
      'n/process-exit-as-throw': 'error',
      'n/hashbang': 'error',
      'promise/prefer-await-to-then': 'error',
      'no-promise-executor-return': 'error',

      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^[A-Z].*\\.jsx?$'] }],
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/expiring-todo-comments': ['error', { allowWarningComments: false }],
      'sonarjs/todo-tag': 'off',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/throw-new-error': 'error',

      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 3 }],
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.keys(globals.node).map((name) => [name, 'off'])),
        ...globals.serviceworker,
      },
    },
  },
  {
    files: ['src/**/__fixtures__/**/*.ts'],
    rules: {
      // Test fixtures expose inferred mock types just like the test files.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  eslintConfigPrettier
);
