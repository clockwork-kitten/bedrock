# Bedrock.js v2 — Transpilation Spike

**Status:** Research only — no implementation yet.
**Goal:** Assess feasibility of mechanically transpiling the Bedrock subset to Go, Rust, and Python.

The Bedrock subset's design (no `this`, no classes, mandatory return types, explicit loops, immutable operations) eliminates the most significant hurdles to mechanical transpilation. The remaining challenges are primarily around mapping JS's structural typing to the nominal type systems of Go/Rust, and transforming block-level error handling (`try/catch`) to statement-level handling.

---

## 1. AST Node Mapping

| Bedrock Construct | Go | Rust | Python |
|---|---|---|---|
| `const x: T = v` | `var x T = v` | `let x: T = v;` | `x: T = v` |
| `let x: T = v` (reassigned) | `var x T = v` | `let mut x: T = v;` | `x: T = v` |
| `function foo(a: A, b: B): R` | `func foo(a A, b B) R` | `fn foo(a: A, b: B) -> R` | `def foo(a: A, b: B) -> R:` |
| `for (let i = 0; i < n; i = i + 1)` | `for i := 0; i < n; i++` | `for i in 0..n` | `for i in range(n):` |
| `[...arr, x]` | `append(append([]T{}, arr...), x)` | `[arr.as_slice(), &[x]].concat()` | `[*arr, x]` |
| `{ ...obj, k: v }` | `NewStruct{existingFields..., K: v}` | `Type { k: v, ..obj }` | `{**obj, "k": v}` |
| `if/else` chain | `if/else` | `if/else` | `if/else` |
| `try/catch/finally` | `if err != nil` + defer | `match result` / `?` operator | `try/except/finally` |
| `async/await` | Blocking calls (see note) | `async/await` (Tokio) | `async/await` (asyncio) |
| `type T = { k: V }` | `type T struct { K V }` | `struct T { k: V }` | `TypedDict` / `@dataclass` |
| `as const` enum | `const` iota or string consts | `enum T` | `StrEnum` |
| `array.map(fn)` | Generic shim or `lo.Map` | `.iter().map(fn).collect()` | `list(map(fn, arr))` |
| `array.filter(fn)` | Generic shim or `lo.Filter` | `.iter().filter(fn).collect()` | `list(filter(fn, arr))` |
| `array.reduce(fn, init)` | Generic shim | `.iter().fold(init, fn)` | `functools.reduce(fn, arr, init)` |
| `Promise.all(promises)` | `errgroup.Group` / `sync.WaitGroup` | `futures::join_all` | `asyncio.gather` |
| `Promise.allSettled(promises)` | `sync.WaitGroup` + collect results | `futures::join_all` + collect | `asyncio.gather(return_exceptions=True)` |

**Note on async/await in Go:** Bedrock bans unawaited promises and requires explicit `try/catch`, which means most Bedrock async code is sequential. Sequential `await` chains map cleanly to blocking Go calls — the async model mostly disappears.

---

## 2. stdlib Shim Requirements

### Array methods
- **Python**: built-in — no shims needed
- **Rust**: `Iterator` trait covers `map`, `filter`, `fold` natively
- **Go**: no generics-based stdlib equivalents until Go 1.21+ (`slices` package). Requires either a shim library (`samber/lo`) or generated type-specific functions. This is the biggest Go friction point.

### Object operations
- `Object.keys(obj)` → Python: `obj.keys()`, Rust: macro/`serde`, Go: reflection (expensive)
- `Object.hasOwn(obj, key)` → Python: `hasattr(obj, key)`, Rust: compile-time only, Go: reflection
- Spread `{ ...obj, k: v }` → trivial in Python; requires struct literal with all fields in Go/Rust

### Async coordination
- `Promise.all` → `asyncio.gather` (Python), `futures::join_all` (Rust), `errgroup` (Go)
- `Promise.allSettled` → `asyncio.gather(return_exceptions=True)` (Python), manual collection (Go/Rust)

### String operations
- String concatenation (`+`) maps directly in all three targets
- No template literals in Bedrock — nothing to shim

### Console/logging
- `console.log` → `fmt.Println` (Go), `println!` (Rust), `print` (Python)

---

## 3. The Hard Problems

### Error propagation (Go and Rust)
JS allows errors to bubble through multiple callers implicitly. In Go, every intermediate function must return `(T, error)` and explicitly check/propagate. In Rust, every intermediate function must return `Result<T, E>` and use `?`. The transpiler would need to infer which functions can fail and rewrite the entire call chain — a significant non-local transformation.

### Structural vs. nominal typing
Bedrock's `type` aliases are structural (duck typing). In Go and Rust, two structs with identical fields are incompatible types. The transpiler must either:
- Enforce that each `type` alias becomes a distinct named struct, requiring explicit conversions at boundaries, or
- Generate interface/trait definitions that allow structural compatibility

Neither is trivial to do automatically.

### Ownership and borrowing (Rust only)
JS's garbage collector makes memory management invisible. Transpiling to Rust requires deciding between:
- `.clone()` everywhere — safe, compiles, but produces slow code
- Explicit lifetimes — correct and fast, but requires reasoning about the entire program's ownership graph

A naive transpiler would use `.clone()` everywhere for correctness, with a future optimization pass as a stretch goal.

### Factory functions and plain objects
The Bedrock pattern is `function createFoo(x: T): FooType { return { x, ... } }`. In Go/Rust, this becomes a constructor function returning a struct — tractable. In Python, it becomes either a `@dataclass` or a plain `dict` — the `dict` form is more faithful to JS but loses type safety.

### `null` vs `undefined`
JS has two "nothing" values. Bedrock's strict null checks (`=== null || === undefined`) collapse both. Mapping to:
- Go: `nil` (for pointers/interfaces) — works
- Rust: `Option<T>` — works, but requires the transpiler to decide when a value is optional
- Python: `None` — works

The transpiler needs a convention: treat `undefined` as equivalent to `null` everywhere (safest).

---

## 4. Recommendations

### Recommended sequencing

**Phase 1 — Python**
Highest semantic parity with JS. `async/await`, `try/except`, list comprehensions, `TypedDict` — all map naturally. The transpiler can focus on AST mapping and shim strategy without fighting the type system. Proves the core pipeline.

**Phase 2 — Go**
Solves the two structural challenges that don't exist in Python: statement-level error handling and synchronous-from-async transformation. The `map/filter/reduce` shim layer (or `lo` dependency) is the main practical friction. Go's explicit typing makes output code readable and auditable.

**Phase 3 — Rust**
The hardest target. Ownership and lifetimes require reasoning the transpiler can't do automatically without significant static analysis. Recommended approach: generate `.clone()`-heavy code in phase 3a, then add a lifetime inference pass in phase 3b.

### Starting point recommendation
**Python first.** It lets the team validate the AST mapping approach, build the shim strategy, and produce something runnable quickly. The learnings from Python directly inform the Go and Rust implementations.

---

## 5. Open Questions

Before implementation starts, these need decisions:

| Question | Options |
|---|---|
| Naming conventions | Preserve JS `camelCase`, or convert to target-idiomatic (`snake_case`, `PascalCase`)? |
| `null`/`undefined` unification | Always map both to the target's null/None/nil? Or preserve the distinction? |
| External boundaries | Transpiler stops at `external-boundary` violations and emits a stub with a `TODO` comment? |
| Go shim strategy | Bundle `samber/lo` as a dependency, or generate type-specific functions inline? |
| Rust clone strategy | Always `.clone()` in v1, or attempt lifetime inference from the start? |
| Type erasure | Should TypeScript `type` aliases survive as named structs, or be inlined? |
| Output style | Emit idiomatic target-language code, or literal translations (even if ugly)? |

---

## Conclusion

The Bedrock subset is well-suited for transpilation — the intentional restrictions (no `this`, no classes, explicit types, explicit loops) remove the hardest JS-specific problems. The remaining work is:

1. A robust AST mapper (JS AST → target AST)
2. A stdlib shim layer per target
3. Language-specific solutions for error propagation (Go/Rust) and ownership (Rust)

Python is the right first target. Estimated rough complexity: Python < Go < Rust, roughly in a 1:3:8 ratio of implementation effort.
