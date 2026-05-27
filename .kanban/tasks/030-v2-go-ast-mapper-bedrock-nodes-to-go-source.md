---
id: 30
title: 'v2 Go: AST mapper — Bedrock nodes to Go source'
status: backlog
priority: medium
created: 2026-05-26T20:21:41.724682-05:00
updated: 2026-05-26T20:21:41.724682-05:00
tags:
    - transpilation
    - go
    - v2
class: standard
---

## Goal
Implement the core AST mapper for the Go transpilation target. Depends on cards #28 (error propagation) and #29 (shims).

## Scope
Map all Bedrock constructs to Go equivalents per V2-SPIKE.md:
- `const x: T = v` → `var x T = v` (or `x := v` where type can be inferred)
- `function foo(a: A, b: B): R` → `func foo(a A, b B) R` (or `(R, error)` if tainted — #28)
- `for (let i = 0; i < n; i = i + 1)` → `for i := 0; i < n; i++`
- `if/else` → `if/else`
- `try/catch/finally` → `if err != nil` + `defer` (via error inference from #28)
- `type T = { k: V }` → `type T struct { K V }` (fields PascalCase for export)
- `as const` enums → `const` block with string constants
- Array spread `[...arr, x]` → `append(append([]T{}, arr...), x)`
- Object spread `{ ...obj, k: v }` → struct literal with all fields (document limitation: all fields must be known)
- String concatenation → `+`
- `console.log` → `fmt.Println`
- async/await → blocking calls (sequential awaits become direct function calls in Go)

## Naming conventions
- `camelCase` function/variable names → `camelCase` (Go convention for unexported)
- `PascalCase` type names → `PascalCase` (Go exported types)
- Struct fields → `PascalCase` (Go exported fields)

## Definition of done
- `src/targets/go/mapper.ts` covering all node types above
- Unit tests with input/output fixtures
- `bun run typecheck` and `bun run test` pass
