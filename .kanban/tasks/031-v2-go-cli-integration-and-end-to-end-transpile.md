---
id: 31
title: 'v2 Go: CLI integration and end-to-end transpile command'
status: backlog
priority: medium
created: 2026-05-26T20:21:53.230054-05:00
updated: 2026-05-26T20:21:53.230054-05:00
tags:
    - transpilation
    - go
    - v2
class: standard
---

## Goal
Integrate the Go transpiler into the Bedrock CLI as `--target go`. Depends on cards #28, #29, #30.

## Scope
- Add `go` as a valid value for the existing `--target` flag (added in Python card #27)
- Wire up: parse Bedrock source → error inference (#28) → Go mapper (#30) with shims (#29) → write `.go` output
- External-boundary violations emit a Go stub: `// TODO: implement external boundary — <violation message>`
- Output file: `foo.ts` → `foo.go` in same directory, or respects `--out-dir`
- Generated Go files get a package declaration: default to `package main`, or infer from directory name

## Open questions to resolve before implementation
- Package naming: default `package main` or infer?
- `null`/`undefined` unification: both become `nil` (for pointer/interface types) — document the limitation that primitive types can't be nil in Go
- Struct field visibility: all fields PascalCase (exported) by default

## Definition of done
- `bedrock src/foo.ts --target go` produces `src/foo.go`
- Integration test: transpile a fixture Bedrock file, assert output passes `gofmt -e` (syntax check)
- `bun run typecheck` and `bun run test` pass
