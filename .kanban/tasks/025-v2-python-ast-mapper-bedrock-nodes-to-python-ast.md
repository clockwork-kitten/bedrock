---
id: 25
title: 'v2 Python: AST mapper — Bedrock nodes to Python AST'
status: backlog
priority: medium
created: 2026-05-26T20:20:43.583865-05:00
updated: 2026-05-26T20:20:43.583865-05:00
tags:
    - transpilation
    - python
    - v2
class: standard
---

## Goal
Implement the core AST mapper for the Python transpilation target. Takes a parsed Bedrock/jscodeshift AST and produces a Python AST (or directly a source string via a printer).

## Scope
Map all Bedrock constructs to their Python equivalents per V2-SPIKE.md:
- Variable declarations: `const`/`let` → annotated assignment (`x: T = v`)
- Function declarations → `def foo(a: A) -> R:`
- `for` loops → `for i in range(n):`
- `if/else` → `if/else`
- `try/catch/finally` → `try/except/finally`
- `async/await` → `async def` / `await`
- `type T = { ... }` → `@dataclass` (preferred over TypedDict for mutability clarity)
- `as const` enums → `StrEnum`
- Array spread `[...arr, x]` → `[*arr, x]`
- Object spread `{ ...obj, k: v }` → `{**obj, 'k': v}`
- String concatenation → direct `+`
- `console.log` → `print`

## Out of scope for this card
- stdlib shims for map/filter/reduce (separate card)
- async coordination (Promise.all etc) (separate card)
- CLI integration

## Definition of done
- A `src/targets/python/mapper.ts` module that accepts a jscodeshift Collection and returns a Python source string
- Unit tests covering all node types above with input/output fixtures
- `bun run typecheck` and `bun run test` pass
