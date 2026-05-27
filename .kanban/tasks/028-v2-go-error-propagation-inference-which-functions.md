---
id: 28
title: 'v2 Go: error propagation inference — which functions need (T, error) returns'
status: backlog
priority: medium
created: 2026-05-26T20:21:16.526964-05:00
updated: 2026-05-26T20:21:16.526964-05:00
tags:
    - transpilation
    - go
    - v2
class: standard
---

## Goal
Solve the hardest Go-specific problem identified in V2-SPIKE.md: inferring which functions can throw/reject, and rewriting their signatures and all callers to use Go's `(T, error)` return convention.

## Problem statement
JS `try/catch` wraps entire blocks and errors bubble implicitly. Go requires every function that can fail to return `(T, error)`, and every caller must explicitly check `if err != nil`. This is a non-local transformation — changing one function's return type ripples through all callers.

## Approach
Two-pass analysis:
1. **Taint pass**: Mark any function that contains a `try/catch`, an `await` (which can reject), or calls a tainted function as "can fail". Propagate transitively.
2. **Rewrite pass**: For every tainted function, change return type to `(ReturnType, error)`. At every `try/catch` site, emit `if err != nil { return zeroVal, err }`. At every call site of a tainted function, add `if err != nil` handling.

## Definition of done
- `src/targets/go/error-inference.ts` — taint analysis pass
- `src/targets/go/error-rewrite.ts` — rewrite pass
- Unit tests: a chain of 3 functions where the innermost throws — assert all three get `(T, error)` signatures and call sites get `if err != nil` checks
- `bun run typecheck` and `bun run test` pass
