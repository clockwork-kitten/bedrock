# Bedrock

## Concept

A semantic normalizer for JavaScript/TypeScript. Where Prettier normalizes appearance, Bedrock normalizes *expression* — ensuring there is one canonical way to write any given computation. The primary goal is to make JS/TS maximally easy to reason about, particularly for AI agents, while remaining fully readable by humans.

Two guiding principles:
- **Explicitness** — prefer explicit multi-step operations over implicit combined ones
- **Immutability** — prefer producing new values over mutating existing ones (takes precedence over Explicitness when they conflict)

---

## Status

In development. Core rule set is defined. Transformer and reporter are being built.

See: `~/Desktop/ai/projects/bedrock/`

---

## Artifacts

| Artifact | Description | Status |
|---|---|---|
| **Transformer** | Takes JS/TS input, outputs canonical Bedrock form (jscodeshift) | In progress |
| **Reporter** | Lists all violations with file/line, no modification | In progress |
| **Grounded file report** | Lists files with zero `external-boundary` violations | Planned |
| **eslint-config-bedrock** | Publishable ESLint config generated from rule registry | v1.5 |

### Violation categories
- `canonical` — mechanically fixable by the transformer
- `type-level` — TypeScript type violations requiring human judgment (not auto-fixable)
- `external-boundary` — impure API interaction that can't be rewritten (DOM, streams, DB clients)

---

## Roadmap

- **v1:** Transformer + Reporter + Grounded report. Rule set stored as structured data.
- **v1.5:** Generate `eslint-config-bedrock` from the structured rule registry
- **v2:** Transpilation to other languages (Go, Rust, Python). The Bedrock subset is intentionally designed to enable this — no `this`, no classes, explicit types, no dynamic weirdness. The main remaining work is stdlib shim layers per target language.

---

## Cross-Cutting Patterns

- **Standalone tooling project** — does not intersect with the game or app projects in any meaningful way. No shared infrastructure, no shared stack decisions.
- **Feeds into shared standards:** The Bedrock rule set informs and validates the global AGENTS.md code style preferences (explicit over implicit, immutability, no `any`, etc.). They are philosophically aligned even if not technically integrated.
- **eslint-config-bedrock (v1.5)** could eventually sit alongside `@josephcarey/eslint-config` in `shared/eslint/` as a stricter optional layer for projects that want maximum AI-readability.

---

## Reference

- Full specification and rule set: `~/Desktop/ai/projects/bedrock/SPEC.md`
- Auto-generated rules reference: `~/Desktop/ai/projects/bedrock/RULES.md`
