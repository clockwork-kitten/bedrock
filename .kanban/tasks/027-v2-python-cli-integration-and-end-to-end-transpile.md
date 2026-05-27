---
id: 27
title: 'v2 Python: CLI integration and end-to-end transpile command'
status: backlog
priority: medium
created: 2026-05-26T20:21:04.837764-05:00
updated: 2026-05-26T20:21:04.837764-05:00
tags:
    - transpilation
    - python
    - v2
class: standard
---

## Goal
Integrate the Python transpiler into the Bedrock CLI as a `--target python` flag. Depends on cards #25 and #26.

## Scope
- Add `--target <lang>` flag to the CLI (initially only `python` supported)
- Wire up: parse Bedrock source → run validator (report external-boundary violations as stubs) → run Python mapper → write `.py` output file alongside source
- External-boundary violations emit a Python stub: `# TODO: implement external boundary — <violation message>`
- Naming convention decision (per V2-SPIKE.md open questions): default to `snake_case` conversion for function and variable names; preserve type names as-is
- Output file: `foo.ts` → `foo.py` in same directory, or `--out-dir` flag

## Open questions to resolve before implementation
- `null`/`undefined` unification: treat both as `None`
- `type` aliases: always become `@dataclass` (not plain dict) for type safety
- Naming: convert `camelCase` identifiers to `snake_case`, leave `PascalCase` as-is

## Definition of done
- `bedrock src/foo.ts --target python` produces `src/foo.py`
- Integration test: transpile a fixture Bedrock file, assert output is valid Python (run `python3 -c` to syntax-check it)
- `bun run typecheck` and `bun run test` pass
