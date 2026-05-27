---
id: 26
title: 'v2 Python: stdlib shim layer (map/filter/reduce, Promise, Object)'
status: backlog
priority: medium
created: 2026-05-26T20:20:52.962928-05:00
updated: 2026-05-26T20:20:52.962928-05:00
tags:
    - transpilation
    - python
    - v2
class: standard
---

## Goal
Implement the Python stdlib shim mappings — converting Bedrock's JS stdlib calls to their Python equivalents.

## Scope
Per V2-SPIKE.md, Python has the best stdlib parity of the three targets:

### Array methods (no shims needed — direct mapping)
- `array.map(fn)` → `list(map(fn, array))`
- `array.filter(fn)` → `list(filter(fn, array))`
- `array.reduce(fn, init)` → `functools.reduce(fn, array, init)`
- `array.slice(a, b)` → `array[a:b]`
- `array.sort(comparator)` → `sorted(array, key=...)` (immutable — correct)
- `[...array].sort(comparator)` → same

### Object operations
- `Object.keys(obj)` → `obj.__dict__.keys()` or dataclass field access
- `Object.hasOwn(obj, key)` → `hasattr(obj, key)`

### Async coordination
- `Promise.all(promises)` → `asyncio.gather(*promises)`
- `Promise.allSettled(promises)` → `asyncio.gather(*promises, return_exceptions=True)`

### Logging
- `console.log(...args)` → `print(*args)`

## Definition of done
- A `src/targets/python/shims.ts` module that maps call expressions to their Python equivalents
- Integrated into the AST mapper (card #25 dependency)
- Tests covering each shim mapping
- `bun run typecheck` and `bun run test` pass
