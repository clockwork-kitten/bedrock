# Bedrock.js — Rules Reference

This document is **auto-generated** from `src/rules/registry.ts`. Do not edit by hand.

## Legend

**Violation categories:**

- **canonical** — mechanically fixable by the Bedrock transformer; highest confidence
- **type-level** — TypeScript type violations that require human judgment to fix (e.g. `any`, `as`, `!`); not auto-fixable
- **external-boundary** — impure API interaction that cannot be rewritten (e.g. DOM, streams, DB clients, callback-based APIs)

**Principles:**

- **Explicitness** — prefer explicit multi-step operations over implicit combined ones
- **Immutability** — prefer producing new values over mutating existing ones
- **Both** — applies both principles simultaneously

## Principled Exceptions

- `array.map()`, `array.filter()`, and `array.reduce()` are **permitted**. They are immutable (return new values), single-purpose, and their explicit `for` loop equivalents require mutable accumulators. The Immutability Principle takes precedence.
- **Early `return`** is explicitly **permitted and encouraged** — it is the canonical replacement for `break`, `continue`, and labeled jumps (via extraction into a named function).
- **Incremental property assignment during initial object construction** is permitted — the mutation ban applies only to already-complete objects.
- `Promise.all()` and `Promise.allSettled()` are **permitted** — they express concurrent execution explicitly.
- **Destructuring** is allowed in two specific canonical positions only: `const [first, ...rest] = array` (head/rest split) and `const { foo, ...rest } = obj` (immutable delete). General destructuring is banned.
- **Spread** is allowed only for immutable derivation: `[...array, x]`, `{ ...obj, key: val }`. Spread in function calls (`foo(...args)`) is banned.

## Variables

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `var x, let x when never reassigned` | `const x` | Explicitness | canonical | ✅ yes |
| `var x` | `const x or let x` | Explicitness | canonical | ✅ yes |

## Equality

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `== and !=` | `=== and !==` | Explicitness | canonical | ✅ yes |

## Functions

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `() => expression or block` | `function foo() {} declarations or function expressions` | Explicitness | canonical | ✅ yes |
| `function foo(x = 0)` | `explicit if check at top of function body` | Explicitness | canonical | — |
| `async function with no await inside` | `remove async or add await` | Explicitness | canonical | — |

## Loops and Iteration

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `array.forEach(fn)` | `for (let i = 0; i < array.length; i++)` | Explicitness | canonical | — |
| `for (const x of array)` | `for (let i = 0; i < array.length; i++)` | Explicitness | canonical | ✅ yes |
| `for (const k in obj)` | `for (let i = 0; i < keys.length; i++) with Object.keys()` | Explicitness | canonical | — |
| `while (cond)` | `for (; cond;) or refactor` | Explicitness | canonical | — |
| `do { } while (cond)` | `for loop with condition at top` | Explicitness | canonical | — |
| `label: statement` | `named function with early return` | Explicitness | canonical | — |
| `break or break label` | `named function with early return` | Explicitness | canonical | — |
| `continue or continue label` | `named function with early return` | Explicitness | canonical | — |

## Array Mutation

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `array.push(x)` | `const newArray = [...array, x]` | Immutability | canonical | ✅ yes |
| `array.unshift(x)` | `const newArray = [x, ...array]` | Immutability | canonical | ✅ yes |
| `array.pop()` | `const last = array[array.length - 1]; const rest = array.slice(0, -1)` | Both | canonical | ✅ yes |
| `array.shift()` | `const [first, ...rest] = array` | Immutability | canonical | ✅ yes |
| `array.splice(...)` | `slice + spread reconstruction` | Immutability | canonical | — |
| `array[i] = x` | `const newArray = [...array.slice(0, i), x, ...array.slice(i + 1)]` | Immutability | canonical | — |

## Object Mutation

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `obj.foo = x (mutation of existing object)` | `const newObj = { ...obj, foo: x }` | Immutability | canonical | — |
| `delete obj.foo` | `const { foo, ...rest } = obj` | Immutability | canonical | — |

## Async

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `.then() / .catch() / .finally()` | `async/await with try/catch/finally` | Explicitness | canonical | — |

## Control Flow

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `x ? a : b` | `if/else block` | Explicitness | canonical | — |
| `switch (x) { case ... }` | `if/else chain or object lookup` | Explicitness | canonical | — |
| `x || defaultVal` | `if (x === null || x === undefined) check` | Explicitness | canonical | — |
| `x && fn()` | `explicit if block` | Explicitness | canonical | — |
| `x ?? defaultVal` | `if (x === null || x === undefined) check` | Explicitness | canonical | — |
| `x?.foo` | `explicit null/undefined check before access` | Explicitness | canonical | — |

## Shorthand Operators

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `x++ / ++x / x-- / --x` | `x = x + 1 / x = x - 1` | Explicitness | canonical | ✅ yes |
| `x += n, x -= n, x *= n, x /= n` | `x = x + n, x = x - n, x = x * n, x = x / n` | Explicitness | canonical | ✅ yes |

## Classes

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `class Foo { }` | `factory function returning a plain object` | Both | canonical | — |
| `this.foo` | `explicit parameter passing` | Explicitness | canonical | — |

## Template Literals

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| ``hello ${name}`` | `"hello " + name` | Explicitness | canonical | ✅ yes |

## TypeScript

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `any` | `unknown with explicit narrowing` | Explicitness | type-level | — |
| `x as Foo without a preceding type guard` | `narrow with if check first` | Explicitness | type-level | — |
| `x!` | `explicit null check` | Explicitness | type-level | — |
| `catch (e)` | `catch (e: unknown)` | Explicitness | type-level | — |
| `enum Foo { }` | `const Foo = { ... } as const; type Foo = typeof Foo[keyof typeof Foo]` | Explicitness | type-level | — |
| `interface Foo { }` | `type Foo = { }` | Explicitness | type-level | — |
| `namespace Foo { } / module Foo { }` | `ES module import/export` | Explicitness | type-level | — |
| `exported function without return type` | `function foo(): ReturnType { }` | Explicitness | type-level | — |

## Array — Additional

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `array.sort()` | `array.sort(comparator)` | Explicitness | canonical | — |
| `array.sort(comparator)` | `[...array].sort(comparator)` | Immutability | canonical | — |
| `[1, , 3]` | `[1, undefined, 3]` | Explicitness | canonical | — |
| `Array(n) or new Array(n)` | `new Array(n).fill(value) or explicit literal` | Explicitness | canonical | — |

## Object — Additional

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `obj.hasOwnProperty(key)` | `Object.hasOwn(obj, key)` | Explicitness | canonical | — |

## Promise — Additional

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `Promise.race([...])` | `Promise.allSettled([...]) + explicit winner selection logic` | Explicitness | canonical | — |
| `Promise.any([...])` | `Promise.allSettled([...]) + explicit first-success logic` | Explicitness | canonical | — |
| `new Promise((resolve, reject) => { })` | `async function; exception: wrapping callback-based APIs at external boundaries` | Explicitness | external-boundary | — |
| `await expr outside try/catch` | `try { const x = await expr; } catch (e: unknown) { }` | Explicitness | canonical | — |

## Spread

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `foo(...args)` | `explicit argument passing` | Explicitness | canonical | — |

## Destructuring

| Banned | Canonical | Principle | Category | Auto-fix |
|---|---|---|---|---|
| `const { a, b } = obj (general destructuring)` | `const a = obj.a; const b = obj.b` | Explicitness | canonical | — |
