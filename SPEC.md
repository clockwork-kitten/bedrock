# Bedrock.js — Specification

## Vision

Bedrock.js is a semantic normalizer for JavaScript/TypeScript. Where Prettier normalizes
appearance, Bedrock normalizes *expression* — ensuring there is one canonical way to write
any given computation. The primary goal is to make JS/TS maximally easy to reason about,
particularly for AI agents, while remaining fully readable by humans.

## Design Principles

### 1. Explicitness Principle
Prefer explicit multi-step operations over implicit combined operations. If a construct
does two things at once, split it into two constructs. Brevity is not a virtue here.

### 2. Immutability Principle
Prefer producing new values over mutating existing ones. When the two principles conflict,
Immutability beats Explicitness — spread is permitted specifically as the canonical form
for deriving a new value from an existing one.

---

## Rule Set

### Variables

| Banned | Canonical | Principle |
|---|---|---|
| `var x` | `const x` or `let x` | Explicitness |
| `let x` when never reassigned | `const x` | Explicitness |

### Equality

| Banned | Canonical | Principle |
|---|---|---|
| `==` | `===` | Explicitness |
| `!=` | `!==` | Explicitness |

### Functions

| Banned | Canonical | Principle |
|---|---|---|
| Arrow functions `() =>` | `function foo()` declarations | Explicitness |
| Default parameters `function foo(x = 0)` | Explicit check at top of function body | Explicitness |
| `async` function with no `await` | Remove `async` or add `await` | Explicitness |

Arrow functions are banned entirely — including inline callbacks.
`array.map(function(x) { return x * 2; })` is the canonical form.

**Early `return` is permitted and encouraged** — returning early from a function on a guard
condition is explicit and reduces nesting. It is the canonical replacement for `break`,
`continue`, and labeled jumps (via extraction into a named function).

### Loops and Iteration

| Banned | Canonical | Principle |
|---|---|---|
| `array.forEach(fn)` | `for (let i = 0; i < array.length; i++)` | Explicitness |
| `for...of` | `for (let i = 0; i < array.length; i++)` | Explicitness |
| `for...in` | `for (let i = 0; i < keys.length; i++)` with `Object.keys()` | Explicitness |
| `while (cond)` | `for (; cond;)` or refactor | Explicitness |
| `do...while (cond)` | `for` loop with condition at top | Explicitness |
| Labeled statements | Refactor into a named function with early `return` | Explicitness |
| `break` (labeled or unlabeled) | Refactor into a named function with early `return` | Explicitness |
| `continue` (labeled or unlabeled) | Refactor into a named function with early `return` | Explicitness |

**Principled exception:** `array.map()`, `array.filter()`, and `array.reduce()` are permitted.
They are immutable (return new values), single-purpose (each does exactly one named thing),
and their explicit `for` loop equivalents require mutable accumulators that are harder to
reason about, not easier. This is the Immutability Principle taking precedence.

### Array Mutation — Immutable Replacements

| Banned (mutating) | Canonical (immutable) | Principle |
|---|---|---|
| `array.push(x)` | `const newArray = [...array, x]` | Immutability |
| `array.unshift(x)` | `const newArray = [x, ...array]` | Immutability |
| `array.pop()` | `const last = array[array.length - 1]; const rest = array.slice(0, -1)` | Immutability + Explicitness |
| `array.shift()` | `const [first, ...rest] = array` | Immutability |
| `array.splice(...)` | slice + spread reconstruction | Immutability |
| `array[i] = x` | `const newArray = [...array.slice(0, i), x, ...array.slice(i + 1)]` | Immutability |

### Object Mutation — Immutable Replacements

| Banned (mutating) | Canonical (immutable) | Principle |
|---|---|---|
| `obj.foo = x` (mutation of existing object) | `const newObj = { ...obj, foo: x }` | Immutability |
| `delete obj.foo` | `const { foo, ...rest } = obj` | Immutability |

**Note:** Incremental property assignment during initial object construction is permitted —
e.g. `const obj = {}; obj.foo = 1;` when the object is being built up before use.
The ban applies to mutation of an already-complete object.

### Async

| Banned | Canonical | Principle |
|---|---|---|
| `.then()/.catch()` chains | `async/await` with `try/catch` | Explicitness |
| `.finally()` | `try/catch/finally` | Explicitness |

### Control Flow

| Banned | Canonical | Principle |
|---|---|---|
| Ternary `x ? a : b` | `if/else` block | Explicitness |
| `switch` statements | `if/else` chain or object lookup | Explicitness |
| `||` for defaults (`x || defaultVal`) | `if (x === null \|\| x === undefined)` check | Explicitness |
| `&&` for conditional execution (`x && fn()`) | explicit `if` block | Explicitness |
| `??` nullish coalescing | `if (x === null \|\| x === undefined)` check | Explicitness |
| `?.` optional chaining | explicit null/undefined check | Explicitness |

### Shorthand Operators

| Banned | Canonical | Principle |
|---|---|---|
| `x++` / `++x` | `x = x + 1` | Explicitness |
| `x--` / `--x` | `x = x - 1` | Explicitness |
| `x += n` | `x = x + n` | Explicitness |
| `x -= n` | `x = x - n` | Explicitness |
| `x *= n` | `x = x * n` | Explicitness |
| `x /= n` | `x = x / n` | Explicitness |

### Classes

| Banned | Canonical | Principle |
|---|---|---|
| `class` syntax | Factory functions returning plain objects | Explicitness + Immutability |
| `this` | Explicit parameter passing | Explicitness |

### Destructuring

Destructuring is permitted only in specific canonical positions:

- **Allowed:** Head/rest array split: `const [first, ...rest] = array`
- **Allowed:** Object rest for immutable delete: `const { foo, ...rest } = obj`
- **Banned:** General destructuring assignment — use explicit property access instead

### Spread

Spread is permitted only for immutable derivation:

- **Allowed:** `[...array, x]`, `{ ...obj, key: val }` — producing new values
- **Banned:** `foo(...args)` — use explicit argument passing

### Template Literals

| Banned | Canonical | Principle |
|---|---|---|
| `` `hello ${name}` `` | `"hello " + name` | Explicitness |

### TypeScript

TypeScript strict mode is required. Beyond `strict: true`, the following additional rules apply:

| Banned | Canonical | Principle |
|---|---|---|
| `any` | `unknown` with explicit narrowing | Explicitness |
| Type assertions `x as Foo` without a preceding type guard | Narrow with `if` check first | Explicitness |
| Non-null assertions `x!` | Explicit null check | Explicitness |
| Bare `catch (e)` | `catch (e: unknown)` | Explicitness |
| `enum` | `as const` object + derived `type` | Explicitness |
| `interface` | `type` | Explicitness |
| `namespace` / `module` keywords | ES module `import`/`export` | Explicitness |
| Missing return type on exported functions | Explicit `: ReturnType` annotation | Explicitness |

**`as const` pattern (canonical enum replacement):**
```ts
const Direction = { Up: "Up", Down: "Down" } as const;
type Direction = typeof Direction[keyof typeof Direction];
```

**Why `type` over `interface`:** `type` is closed and explicit. `interface` supports
declaration merging and extension in ways that are harder to reason about statically.

### Array — Additional Rules

| Banned | Canonical | Principle |
|---|---|---|
| `array.sort()` without comparator | Always provide explicit comparator | Explicitness |
| `array.sort(comparator)` (mutating) | `[...array].sort(comparator)` | Immutability |
| Sparse arrays `[1, , 3]` | Always use explicit `undefined` | Explicitness |
| `Array(n)` constructor | `new Array(n).fill(value)` or explicit literal | Explicitness |

### Object — Additional Rules

| Banned | Canonical | Principle |
|---|---|---|
| `obj.hasOwnProperty(key)` | `Object.hasOwn(obj, key)` | Explicitness |

### Promise — Additional Rules

| Banned | Canonical | Principle |
|---|---|---|
| `Promise.race()` | `Promise.allSettled()` + explicit winner selection logic | Explicitness |
| `Promise.any()` | `Promise.allSettled()` + explicit first-success logic | Explicitness |
| `new Promise()` constructor | `async` function; exception: wrapping callback-based APIs at external boundaries (e.g. `fs.readFile`) is the one accepted use — reported as `external-boundary`, not auto-fixed | Explicitness |
| Unhandled rejections (bare `await` outside `try/catch`) | Always wrap `await` in `try/catch` | Explicitness |

**Permitted:** `Promise.all()` and `Promise.allSettled()` — both express concurrent execution
explicitly and return full results. `Promise.all()` short-circuits on rejection; use
`Promise.allSettled()` when all results are needed regardless of failure.

---

## Artifacts

1. **Transformer** — takes JS/TS input, outputs canonical Bedrock.js (using `jscodeshift`)
2. **Reporter** — lists all violations with file/line without modifying code; violations are
   categorized as:
   - `canonical` — mechanically fixable by the transformer
   - `type-level` — TypeScript type violations that require human judgment to fix (e.g. `any`, `as`, `!`); not auto-fixable
   - `external-boundary` — impure API interaction that cannot be rewritten (e.g. DOM, streams, DB clients)
3. **Grounded file report** — lists files with zero `external-boundary` violations, i.e. files
   that are fully within the Bedrock subset.
4. **ESLint config** — `eslint-config-bedrock` as a publishable standalone artifact (v1.5);
   rule set will be stored as structured data in v1 to make this generation straightforward

## Out of Scope (v1)

- Module system normalization (ESM vs CJS)
- Import ordering / grouping
- Dead code elimination
- Minification or performance optimization
- JSX / React-specific rules
- `eslint-config-bedrock` generation (planned v1.5 — build v1 with structured rule data)

## Future Goals

- **v1.5:** Generate `eslint-config-bedrock` from structured rule data
- **v2:** Transpilation to other languages (Go, Rust, Python). The Bedrock subset is
  designed with this in mind — no `this`, no classes, explicit types, explicit return types,
  no dynamic weirdness. The main remaining work for a transpiler is stdlib shim layers per
  target language. Structured rule data from v1 doubles as the input grammar spec.

---

## Decisions Log

| Question | Decision |
|---|---|
| Ban `map/filter/reduce`? | No — kept as principled exception; immutable + single-purpose |
| Third-party mutation APIs? | Report as `external-boundary` violations (things Bedrock cannot rewrite, e.g. DOM APIs, Node streams, Express middleware, DB clients); `canonical` violations are auto-fixable by the transformer |
| ESLint config artifact? | v1.5; store rule set as structured data in v1 to enable generation |
| Name for "purity report"? | "Grounded" — files with zero `external-boundary` violations |
| Arrow functions in callbacks? | Banned entirely — no exceptions; use `function` keyword everywhere |
| `obj.foo = x` during construction? | Allowed — ban applies only to mutation of already-complete objects |
| `??` nullish coalescing? | Banned — use explicit `if (x === null \|\| x === undefined)` |
| `?.` optional chaining? | Banned — use explicit null/undefined check |
| `async` without `await`? | Banned — remove `async` or the function genuinely needs `await` |
| `while` / `do...while`? | Banned — canonical form is always `for` |
| Labeled statements, labeled `break`/`continue`? | Banned — refactor into a named function with early `return` |
| Unlabeled `break`/`continue`? | Banned — same reasoning; early `return` via extracted function is canonical |
| Early `return`? | Explicitly permitted — canonical replacement for jumps; reduces nesting |
| TypeScript strict mode? | Required — plus additional rules: no `any`, no `!`, no `as`, no `enum`, `type` over `interface`, explicit return types |
| Violation categories? | Three: `canonical` (auto-fixable), `type-level` (human-fixable TS type issues), `external-boundary` (unrewritable API interaction) |
| `Promise.race()` / `Promise.any()`? | Banned — implicit "first wins" semantics; use `Promise.allSettled()` + explicit selection logic |
| `Promise.all()` / `Promise.allSettled()`? | Permitted — express concurrent execution explicitly |
| `new Promise()` constructor? | Banned except for callback-based API wrapping at external boundaries; reported as `external-boundary`, not auto-fixed |
| Transpilation to other languages? | v2 goal — Bedrock subset is intentionally designed to enable this |
