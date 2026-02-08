# Coding Guidelines

## Use `pnpm` instead of `npm`

- This applies to all commands like `pnpm build`, `pnpm dev` etc.
- This is especially needed for `pnpm install`
  - Never run `npm install`. Always use `pnpm install`. Always use `pnpm` for all package management tasks.

## Always run `pnpm check` before marking task complete

- If `pnpm check` returns errors or warnings, fix them!
- When fixing errors in `pnpm check`
  - Do not use eslint disable to just disable the checks. Make genuine effort to fix the issues
- If `pnpm check` reports code duplication issues, consider refactoring common code into a common re-usable utility function or component

## Keep components/functions small and simple

- Separate UI and pure functions as far as possible
- Move pure functions into separate files and import them into the component
- If a component definition or function is over 120 lines, it's probably time to refactor it
  - Consider refactoring it into smaller, more manageable components/pure functions

## Refactoring files

- Use `git mv` instead of `mv` as far as possible
  - If former is not possible, then you may use `mv`