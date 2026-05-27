---
id: 29
title: 'v2 Go: stdlib shim strategy — map/filter/reduce and Object operations'
status: backlog
priority: medium
created: 2026-05-26T20:21:29.686853-05:00
updated: 2026-05-26T20:21:29.686853-05:00
tags:
    - transpilation
    - go
    - v2
class: standard
---

## Goal
Decide and implement the Go shim strategy for array methods and Object operations — the second major Go-specific challenge from V2-SPIKE.md.

## Problem statement
Go's stdlib has no generic `map`/`filter`/`reduce` equivalents (until Go 1.21's `slices` package, which still doesn't cover `reduce`). Options:

1. **Depend on `samber/lo`** — a well-maintained generics library with `lo.Map`, `lo.Filter`, `lo.Reduce`. Clean output, external dep.
2. **Generate type-specific helpers inline** — no external dep, but produces verbose output for each concrete type encountered.
3. **Use Go 1.21+ `slices` package** — covers `map` via `slices.Collect(iter.Map(...)))`, awkward for `reduce`.

## Recommendation from spike
Option 1 (`samber/lo`) — cleanest output, well-maintained, widely used in the Go ecosystem.

## Scope
- Decide and document the shim strategy (resolve the open question)
- Implement `src/targets/go/shims.ts` mapping:
  - `array.map(fn)` → `lo.Map(array, fn)`
  - `array.filter(fn)` → `lo.Filter(array, fn)`
  - `array.reduce(fn, init)` → `lo.Reduce(array, fn, init)`
  - `array.slice(a, b)` → `array[a:b]`
  - `[...array].sort(comparator)` → `lo.Slice` + sort
  - `Object.keys(obj)` → reflection shim or struct tag iteration (document limitation)
  - `Promise.all` → `errgroup.Group`
  - `Promise.allSettled` → `sync.WaitGroup` + result collection
  - `console.log` → `fmt.Println`

## Definition of done
- Strategy documented and decided
- `src/targets/go/shims.ts` implemented
- Tests covering each mapping
- `bun run typecheck` and `bun run test` pass
