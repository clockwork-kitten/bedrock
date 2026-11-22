# Bedrock T0 Freeze Inventory

Authoritative source: `docs/bedrock-disposition.json` + `docs/bedrock-consumers.json`.

## Denominators

| Surface | Count |
|---|---:|
| Registry rule IDs | 53 |
| Runtime reporter IDs | 9 |
| Fixer exports | 16 |
| Detector exports (wired/unwired) | 37 (35/2) |
| Fixture pairs | 79 |
| Package scripts | 10 |
| Generated artifacts | 3 |
| Workflows (jobs) | 2 (3) |
| Suppression mechanisms | 0 |

## Registry-vs-wired fixer mismatch

- Declared auto-fixable IDs: 12
- Wired fixer symbols: 16
- Wired fixer rule IDs not declared auto-fixable: no-default-parameters, no-for-each, no-for-in, no-has-own-property, no-mutating-sort, no-sort-without-comparator, no-sparse-arrays, no-while
- Declared auto-fixable IDs without wired fixer: no-array-pop, no-array-shift

## Downstream slices (S/M/L only)

| Slice | Repo | Size | Status |
|---|---|---|---|
| studio-board#91 | clockwork-kitten/bedrock | M | implemented-here |
| studio-board#96 | clockwork-kitten/crux | L | existing |
| studio-board#131 | clockwork-kitten/standards | M | existing |
| studio-board#133 | clockwork-kitten/crucible | L | existing |
| studio-board#134 | clockwork-kitten/crucible | M | existing |
| studio-board#135 | clockwork-kitten/bedrock | S | existing |

## Reproduction commands

```sh
bun run inventory:generate
bun run inventory:check
```

## Consumer discovery bounds

clockwork-kitten org repositories discoverable via authenticated GitHub code search plus npm public registry lookups
