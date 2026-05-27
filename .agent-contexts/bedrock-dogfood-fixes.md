# Task: Bedrock Dogfood Violation Fixes

## What was built
Manually fixed all canonical Bedrock violations in 9 target source files. Reduced violations from 37 (31 canonical + 6 type-level) to 6 (0 canonical + 6 type-level).

## Key decisions made

- **`&&` in `if` conditions**: The `no-shortcircuit-control` rule fires on ALL `LogicalExpression` nodes including those inside `if` conditions, not just standalone expression statements. Had to convert `if (a && b)` to nested `if (a) { if (b) {...} }`.
- **`||` in null checks**: Even `if (x === null || x === undefined)` triggers the `||` rule. Had to split into two separate `if` checks.
- **`continue` → helper functions**: Extracted loop bodies with `continue` into named helper functions that return early (or return undefined/empty array).
- **`break` in glob base finder**: Extracted the inner `for` loop with `break` into a standalone `findBaseIndex` function that uses `return` instead.
- **Ternaries**: All converted to `if/else` blocks.
- **`??` nullish coalescing**: Replaced with explicit null then undefined checks.
- **`type-level` violations**: Left all `as` casts as-is per instructions.
- **`array.push()` mutations**: Left as-is — these are on internal accumulator arrays being built up, permitted per instructions.

## Files changed

- `src/cli/args.ts` — removed `||` default, replaced filter+`&&` with nested if loop
- `src/cli/runner.ts` — major rewrite: extracted helpers for `walkDir` continue, `resolvePatterns` continue/break/ternary, `runFix` ternary parser, `runReport` ternary exitCode, `isGlobPattern` `||`
- `src/transformer/transform.ts` — replaced `??` with two explicit null/undefined checks
- `src/transformer/parse.ts` — replaced ternary in `withParser` call with if/else
- `src/reporter/format.ts` — ternary in `padRight`, `continue` in `formatReport` (extracted to helper), two ternaries in summary line
- `src/reporter/run.ts` — replaced ternary+`||` parser detection with if/else chain
- `src/testing/fixture-runner.ts` — extracted `collectFixturePair` helper to eliminate `continue`, split `||` in `detectParser` to two if checks
- `src/generate/rules-md.ts` — ternary in `autoFixLabel`, `||`/`continue` in section loop (extracted `renderSectionLines` helper)
- `src/generate/eslint-config.ts` — extracted `buildConfigEntry` helper to eliminate `continue`/ternary/array-index mutation, uses spread to build config immutably

## Tests written
No new tests — all existing 187 tests pass unchanged.

## Issues encountered
- When inserting `renderSectionLines` before `renderTable` in rules-md.ts, accidentally cut the `const rows = entries.map(...)` line from `renderTable`. Fixed by restoring the full function body.
- The `||` rule fires even inside the pattern `if (x === null || x === undefined)` which is the rule's own recommended replacement — required splitting into two separate `if` checks.
