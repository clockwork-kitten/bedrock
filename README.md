# Bedrock.js

A semantic normalizer for JavaScript and TypeScript.

Where Prettier normalizes *appearance*, Bedrock normalizes *expression* — ensuring there is one canonical way to write any given computation. The goal is to make JS/TS maximally easy to reason about, particularly for AI agents, while remaining fully readable by humans.

## Design Principles

**Explicitness** — prefer explicit multi-step operations over implicit combined ones. If a construct does two things at once, split it into two.

**Immutability** — prefer producing new values over mutating existing ones. When the two principles conflict, Immutability wins — spread is the canonical form for deriving new values.

## Installation

```sh
bun add -d bedrock
```

Or run directly without installing:

```sh
bunx bedrock src/**/*.ts --report
```

## Usage

```sh
# Report all violations — exits 1 if any found
bedrock src/**/*.ts --report

# Auto-fix all mechanically rewritable violations in place
bedrock src/**/*.ts --fix

# Fix first, then report remaining violations
bedrock src/**/*.ts --fix --report

# Defaults to --report if no flag given
bedrock src/foo.ts
```

## What it does

Bedrock finds and fixes patterns that violate its two principles. Violations fall into three categories:

- **canonical** — auto-fixable by the transformer (e.g. `var` → `const`, `==` → `===`, arrow functions → `function` declarations)
- **type-level** — TypeScript type issues requiring human judgment (e.g. `any`, `as`, `!`)
- **external-boundary** — impure API interactions that can't be rewritten (e.g. `.then()` chains, DOM mutation, `new Promise()`)

A file with zero `external-boundary` violations is considered **grounded** — fully within the Bedrock subset.

## Example

Input:

```ts
var count = 0;
const greet = (name: string) => `hello ${name}`;
const nums = [1, 2, 3];
nums.push(4);
count += 1;
```

After `bedrock --fix`:

```ts
let count = 0;
const greet = function greet(name: string) {
  return "hello " + name;
};
const nums = [1, 2, 3];
const nums2 = [...nums, 4];
count = count + 1;
```

## Rules

See [RULES.md](./RULES.md) for the full rule reference. Generated automatically from the rule registry.

Highlights:

| Area | Example banned | Canonical |
|---|---|---|
| Variables | `var x`, `let x` (never reassigned) | `const x` |
| Equality | `==`, `!=` | `===`, `!==` |
| Functions | `() => x` | `function foo() { return x; }` |
| Loops | `forEach`, `for...of`, `while` | `for (let i = 0; ...)` |
| Arrays | `array.push(x)` | `[...array, x]` |
| Objects | `obj.foo = x` | `const newObj = { ...obj, foo: x }` |
| Async | `.then()/.catch()` | `async/await` with `try/catch` |
| Control flow | ternary, `switch`, `??`, `?.` | explicit `if/else` |
| Shorthand | `x++`, `x += n` | `x = x + 1`, `x = x + n` |
| Classes | `class`, `this` | factory functions, explicit params |
| Strings | `` `hello ${name}` `` | `"hello " + name` |
| TypeScript | `any`, `!`, `as`, `enum`, `interface` | `unknown`, explicit checks, `type` |

**Principled exceptions:** `array.map()`, `array.filter()`, `array.reduce()`, `Promise.all()`, `Promise.allSettled()`, and early `return` are all permitted.

## Scripts

```sh
bun run test       # run all tests (182 across 20 test files)
bun run typecheck  # TypeScript strict check
bun run build      # compile to dist/
bun run generate   # regenerate RULES.md and eslint-config-bedrock.json
```

## ESLint config

A generated `eslint-config-bedrock.json` is included — a subset of the rules that have direct ESLint equivalents (`prefer-const`, `no-var`, `eqeqeq`, `no-plusplus`, etc.). For the full rule set, use the Bedrock CLI directly.

## Architecture

```
src/
  transformer/   — parse → AST → apply passes → print
  rules/         — one module per rule; TransformPass (auto-fix) + ViolationPass (detect)
  reporter/      — runs all violation passes, formats output, tracks grounded files
  cli/           — argument parsing, glob resolution, fix/report orchestration
  testing/       — fixture-based test harness used by all rule tests
  generate/      — RULES.md and ESLint config generators
  __fixtures__/  — input/output fixture pairs, one directory per rule
scripts/
  generate.ts    — runs the generators and writes output files
```

## Status

v1 complete. Planned:

- **v1.5** — publish `eslint-config-bedrock` as a standalone npm package
- **v2** — transpilation to other languages (Go, Rust, Python); the Bedrock subset is intentionally designed for this

## License

MIT
