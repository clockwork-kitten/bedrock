import {
  CONSUMER_SNAPSHOT,
  DETECTOR_TO_RULE_IDS,
  DOWNSTREAM_SLICES,
  FIXER_TO_RULE_IDS,
  resolveRuleDisposition,
} from "./constants.js";
import { PINNED_CONSUMER_EVIDENCE } from "./consumer-evidence.js";
import type {
  ConsumerEvidence,
  ConsumerEvidenceCapture,
  FreezeDispositionDocument,
  InventoryRow,
  SourceFacts,
  SurfaceFact,
} from "./types.js";

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function assertExactDispositionCoverage(
  sourceIds: string[],
  rows: Array<{ id: string }>,
  label: string,
): void {
  const duplicateSourceIds = sourceIds.filter(function (id, index) {
    return sourceIds.indexOf(id) !== index;
  });
  const rowIds = rows.map(function (row) {
    return row.id;
  });
  const duplicateRowIds = rowIds.filter(function (id, index) {
    return rowIds.indexOf(id) !== index;
  });
  const missing = sourceIds.filter(function (id) {
    return !rowIds.includes(id);
  });
  const unknown = rowIds.filter(function (id) {
    return !sourceIds.includes(id);
  });
  if (
    duplicateSourceIds.length > 0 ||
    duplicateRowIds.length > 0 ||
    missing.length > 0 ||
    unknown.length > 0
  ) {
    throw new Error(
      label +
        " disposition coverage mismatch; duplicate source: " +
        sortUnique(duplicateSourceIds).join(", ") +
        "; duplicate rows: " +
        sortUnique(duplicateRowIds).join(", ") +
        "; missing: " +
        missing.join(", ") +
        "; unknown: " +
        unknown.join(", "),
    );
  }
}

export function assertSourceFingerprint(
  expected: string,
  actual: string,
): void {
  if (expected !== actual) {
    throw new Error(
      "Stale source fingerprint: evidence records " + expected + " but source is " + actual,
    );
  }
}

export function validateConsumerEvidence(
  evidence: ConsumerEvidence,
  capture: ConsumerEvidenceCapture = PINNED_CONSUMER_EVIDENCE,
): void {
  const queryIds = evidence.queries.map(function (query) {
    return query.id;
  });
  if (new Set(queryIds).size !== queryIds.length) {
    throw new Error("Duplicate consumer query IDs");
  }
  if (evidence.observedAt !== capture.capturedAt) {
    throw new Error("Consumer evidence capture date does not match pinned evidence");
  }
  if (JSON.stringify(evidence.organizationCounts) !== JSON.stringify(capture.organizationCounts)) {
    throw new Error("Consumer organization counts do not match pinned evidence");
  }
  const captureQueries = new Map(
    capture.queries.map(function (query) {
      return [query.id, query];
    }),
  );
  const missingQueries = capture.queries.filter(function (query) {
    return !queryIds.includes(query.id);
  });
  const unknownQueries = evidence.queries.filter(function (query) {
    return !captureQueries.has(query.id);
  });
  if (missingQueries.length > 0 || unknownQueries.length > 0) {
    throw new Error(
      "Consumer query set does not match pinned evidence; missing: " +
        missingQueries
          .map(function (query) {
            return query.id;
          })
          .join(", ") +
        "; unknown: " +
        unknownQueries
          .map(function (query) {
            return query.id;
          })
          .join(", "),
    );
  }
  for (const query of evidence.queries) {
    if (captureQueries.get(query.id)?.command !== query.command) {
      throw new Error("Consumer query command does not match pinned evidence: " + query.id);
    }
  }
  const pinnedRevisionEntries = Object.entries(capture.repositoryHeads).map(
    function ([repository, head]) {
      return [repository, head.revision] as const;
    },
  );
  if (
    JSON.stringify(Object.entries(evidence.repositoryRevisions).sort()) !==
    JSON.stringify(pinnedRevisionEntries.sort())
  ) {
    throw new Error("Consumer repository revisions do not match pinned default-branch heads");
  }
  const seen = new Set<string>();
  for (const result of evidence.results) {
    if (!queryIds.includes(result.queryId)) {
      throw new Error("Consumer result has unknown query: " + result.queryId);
    }
    if (
      result.classification !== "functional-consumer" &&
      result.classification !== "reference-only" &&
      result.classification !== "regression-evidence"
    ) {
      throw new Error(
        "Consumer result is unclassified: " +
          result.repository +
          ":" +
          result.path,
      );
    }
    const revision = capture.repositoryHeads[result.repository]?.revision;
    if (
      revision === undefined ||
      revision !== result.revision ||
      evidence.repositoryRevisions[result.repository] !== revision
    ) {
      throw new Error(
        "Consumer result does not match pinned default-branch revision: " +
          result.repository +
          ":" +
          result.path,
      );
    }
    const key = result.queryId + "\0" + result.repository + "\0" + result.path;
    if (seen.has(key)) {
      throw new Error("Duplicate consumer query result: " + key.replaceAll("\0", ":"));
    }
    seen.add(key);
  }
  for (const query of capture.queries) {
    const expected = query.results
      .map(function (result) {
        return query.id + "\0" + result.repository + "\0" + result.path;
      })
      .sort();
    const actual = evidence.results
      .filter(function (result) {
        return result.queryId === query.id;
      })
      .map(function (result) {
        return result.queryId + "\0" + result.repository + "\0" + result.path;
      })
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error("Consumer results do not match pinned query evidence: " + query.id);
    }
  }
  if (JSON.stringify(evidence.npmQueries) !== JSON.stringify(capture.npmQueries)) {
    throw new Error("Consumer npm results do not match pinned evidence");
  }
}

function buildRuleFixerMap(wiredFixers: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const fixerSymbol of wiredFixers) {
    const ruleIds = FIXER_TO_RULE_IDS[fixerSymbol];
    if (ruleIds === undefined) {
      throw new Error("Missing fixer disposition mapping for: " + fixerSymbol);
    }
    for (const ruleId of ruleIds) {
      map.set(ruleId, sortUnique([...(map.get(ruleId) ?? []), fixerSymbol]));
    }
  }
  return map;
}

function buildFixerRows(facts: SourceFacts): InventoryRow[] {
  return facts.fixers.exported.map(function (symbol) {
    const ruleIds = FIXER_TO_RULE_IDS[symbol];
    if (ruleIds === undefined) {
      throw new Error("Missing fixer disposition mapping for: " + symbol);
    }
    const inheritedDisposition = ruleIds.some(function (ruleId) {
      return resolveRuleDisposition(ruleId).disposition === "candidate-pending-96";
    })
      ? "candidate-pending-96"
      : "dropped";
    return {
      id: symbol,
      kind: "fixer",
      sourcePath: "src/rules/**/index.ts",
      disposition: inheritedDisposition,
      rationale:
        "Bedrock AST fixer is retired; approved concepts are reimplemented under Crucible ownership (#133), without compatibility aliases.",
      proposedOwner: inheritedDisposition === "candidate-pending-96" ? "crucible" : null,
      proposedCruxId: null,
    };
  });
}

function buildDetectorRows(
  facts: SourceFacts,
): Array<InventoryRow & { reporterIds: string[]; wiredInReporter: boolean }> {
  const wiringBySymbol = new Map<string, string[]>();
  for (const row of facts.detectors.wiredInReporter) {
    wiringBySymbol.set(
      row.symbol,
      sortUnique([...(wiringBySymbol.get(row.symbol) ?? []), row.reporterId]),
    );
  }
  return facts.detectors.exported.map(function (symbol) {
    const ruleIds = DETECTOR_TO_RULE_IDS[symbol];
    if (ruleIds === undefined) {
      throw new Error("Missing detector disposition mapping for: " + symbol);
    }
    const reporterIds = wiringBySymbol.get(symbol) ?? [];
    const inheritedDisposition = ruleIds.some(function (ruleId) {
      return resolveRuleDisposition(ruleId).disposition === "candidate-pending-96";
    })
      ? "candidate-pending-96"
      : "dropped";
    const wiredInReporter = reporterIds.length > 0;
    return {
      id: symbol,
      kind: "detector",
      sourcePath: "src/rules/**/index.ts",
      disposition: inheritedDisposition,
      rationale: wiredInReporter
        ? "Diagnostic-only evidence: detector inherits the concept disposition of its legacy rule IDs; output compatibility is not preserved."
        : "Dropped-unreachable: exported detector is not wired in reporter pass registration.",
      proposedOwner: inheritedDisposition === "candidate-pending-96" ? "crucible" : null,
      proposedCruxId: null,
      reporterIds,
      wiredInReporter,
    };
  });
}

function buildReporterRows(facts: SourceFacts): InventoryRow[] {
  return facts.reporterIds.map(function (id) {
    return {
      id,
      kind: "reporter-id",
      sourcePath: "src/reporter/rules.ts",
      disposition: "dropped",
      rationale:
        "Diagnostic-only evidence: coarse Bedrock reporter ID is retired and is not preserved as an alias in the clean break.",
      proposedOwner: null,
      proposedCruxId: null,
    };
  });
}

function surfaceRationale(surface: SurfaceFact): string {
  switch (surface.kind) {
    case "reporter-contract":
      return "Diagnostic-only evidence: Bedrock rendering, parser selection, grounding, and exit behavior are retired; canonical output contracts are owned by #134.";
    case "cli-contract":
      return "Dropped in the clean break: Bedrock flags, input expansion, parser routing, modes, and exit behavior receive no command or compatibility alias.";
    case "config-artifact":
    case "package-bin":
    case "package-identity":
      return "Dropped in the clean break: Bedrock package/config identity is retired in favor of Crucible-owned bundles under #134.";
    case "package-script":
    case "script-file":
    case "workflow":
    case "workflow-job":
      return "Dropped with Bedrock repository retirement under #135; this build/release/development surface is not a public compatibility contract.";
    default:
      throw new Error("Missing surface disposition mapping for: " + (surface as SurfaceFact).kind);
  }
}

function buildSurfaceRows(facts: SourceFacts): InventoryRow[] {
  return facts.surfaces.map(function (surface) {
    return {
      ...surface,
      disposition: "dropped",
      rationale: surfaceRationale(surface),
      proposedOwner: null,
      proposedCruxId: null,
    };
  });
}

function countSurfaces(facts: SourceFacts, kind: SurfaceFact["kind"]): number {
  return facts.surfaces.filter(function (surface) {
    return surface.kind === kind;
  }).length;
}

function formatMarkdown(doc: FreezeDispositionDocument): string {
  const lines = [
    "# Bedrock T0 Freeze Inventory",
    "",
    "Authoritative source: `docs/bedrock-disposition.json` + `docs/bedrock-consumers.json`.",
    "",
    "The ledger is diagnostic-only evidence for a clean break. It creates no command, package, rule-ID, suppression, or output compatibility promise.",
    "",
    "## Denominators",
    "",
    "| Surface | Count |",
    "|---|---:|",
    "| Registry rule IDs | " + doc.denominators.registryRuleIds + " |",
    "| Runtime reporter IDs | " + doc.denominators.reporterIds + " |",
    "| Reporter contracts | " + doc.denominators.reporterContracts + " |",
    "| CLI contracts | " + doc.denominators.cliContracts + " |",
    "| Fixer exports | " + doc.denominators.fixerExports + " |",
    "| Detector exports (wired/unwired) | " +
      doc.denominators.detectorExports +
      " (" +
      doc.denominators.detectorWired +
      "/" +
      doc.denominators.detectorUnwired +
      ") |",
    "| Fixture pairs | " + doc.denominators.fixturePairs + " |",
    "| Package identities / bins | " +
      doc.denominators.packageIdentities +
      " / " +
      doc.denominators.packageBins +
      " |",
    "| Package scripts / script files | " +
      doc.denominators.packageScripts +
      " / " +
      doc.denominators.scriptFiles +
      " |",
    "| Generated config artifacts | " + doc.denominators.generatedArtifacts + " |",
    "| Workflows (jobs) | " +
      doc.denominators.workflows +
      " (" +
      doc.denominators.workflowJobs +
      ") |",
    "| Suppression search hits / mechanisms | " +
      doc.denominators.suppressionSearchHits +
      " / " +
      doc.denominators.suppressionMechanisms +
      " |",
    "",
    "## Registry-vs-wired fixer mismatch",
    "",
    "- Declared auto-fixable IDs: " + doc.mismatchEvidence.declaredAutoFixableRuleIds.length,
    "- Wired fixer symbols: " + doc.mismatchEvidence.wiredFixerSymbols.length,
    "- Wired fixer rule IDs not declared auto-fixable: " +
      doc.mismatchEvidence.wiredFixerRuleIdsNotDeclaredAutoFixable.join(", "),
    "- Declared auto-fixable IDs without wired fixer: " +
      doc.mismatchEvidence.declaredAutoFixableRuleIdsWithoutWiredFixer.join(", "),
    "",
    "## Downstream slices (S/M/L only)",
    "",
    "| Slice | Repo | Size | Status |",
    "|---|---|---|---|",
  ];
  for (const slice of doc.downstreamSlices) {
    lines.push(
      "| " + slice.id + " | " + slice.repository + " | " + slice.size + " | " + slice.status + " |",
    );
  }
  lines.push(
    "",
    "## Reproduction commands",
    "",
    "```sh",
    "bun run inventory:generate",
    "bun run inventory:check",
    "```",
    "",
    "## Consumer discovery bounds",
    "",
    CONSUMER_SNAPSHOT.boundedUniverse,
  );
  return lines.join("\n") + "\n";
}

export function buildFreezeDispositionDocument(
  facts: SourceFacts,
  generatedAt: string,
): FreezeDispositionDocument {
  const ruleFixerMap = buildRuleFixerMap(facts.fixers.wiredInCli);
  const ruleRows = facts.rules.ids
    .map(function (ruleId) {
      return {
        ...resolveRuleDisposition(ruleId),
        declaredAutoFixable: facts.rules.declaredAutoFixable.includes(ruleId),
        fixerSymbols: ruleFixerMap.get(ruleId) ?? [],
      };
    })
    .sort(function (a, b) {
      return a.legacyRuleId.localeCompare(b.legacyRuleId);
    });
  const reporterRows = buildReporterRows(facts);
  const fixerRows = buildFixerRows(facts);
  const detectorRows = buildDetectorRows(facts);
  const surfaceRows = buildSurfaceRows(facts);
  assertExactDispositionCoverage(facts.rules.ids, ruleRows.map(function (row) {
    return { id: row.legacyRuleId };
  }), "Rule");
  assertExactDispositionCoverage(facts.reporterIds, reporterRows, "Reporter ID");
  assertExactDispositionCoverage(facts.fixers.exported, fixerRows, "Fixer");
  assertExactDispositionCoverage(facts.detectors.exported, detectorRows, "Detector");
  assertExactDispositionCoverage(
    facts.surfaces.map(function (surface) {
      return surface.id;
    }),
    surfaceRows,
    "Surface",
  );
  const fixerRuleIds = sortUnique(
    facts.fixers.wiredInCli.flatMap(function (symbol) {
      return FIXER_TO_RULE_IDS[symbol] ?? [];
    }),
  );
  const wiredDetectorSymbols = sortUnique(
    facts.detectors.wiredInReporter.map(function (row) {
      return row.symbol;
    }),
  );
  return {
    schemaVersion: 2,
    generatedAt,
    sourceFingerprint: facts.sourceFingerprint,
    authority: {
      issue: "clockwork-kitten/studio-board#91",
      requirementsIssue: "clockwork-kitten/studio-board#86",
      briefIssue: "clockwork-kitten/studio-board#87",
      permanentIdsAssignedBy: "clockwork-kitten/studio-board#96",
    },
    denominators: {
      registryRuleIds: facts.rules.ids.length,
      reporterIds: facts.reporterIds.length,
      fixerExports: facts.fixers.exported.length,
      detectorExports: facts.detectors.exported.length,
      detectorWired: wiredDetectorSymbols.length,
      detectorUnwired: facts.detectors.exported.length - wiredDetectorSymbols.length,
      fixturePairs: facts.fixtureHashes.length,
      reporterContracts: countSurfaces(facts, "reporter-contract"),
      cliContracts: countSurfaces(facts, "cli-contract"),
      packageIdentities: countSurfaces(facts, "package-identity"),
      packageBins: countSurfaces(facts, "package-bin"),
      packageScripts: countSurfaces(facts, "package-script"),
      scriptFiles: countSurfaces(facts, "script-file"),
      generatedArtifacts: countSurfaces(facts, "config-artifact"),
      workflows: countSurfaces(facts, "workflow"),
      workflowJobs: countSurfaces(facts, "workflow-job"),
      suppressionSearchHits: facts.suppressionHits.length,
      suppressionMechanisms: 0,
    },
    mismatchEvidence: {
      declaredAutoFixableRuleIds: facts.rules.declaredAutoFixable,
      wiredFixerSymbols: facts.fixers.wiredInCli,
      wiredFixerRuleIdsNotDeclaredAutoFixable: fixerRuleIds.filter(function (ruleId) {
        return !facts.rules.declaredAutoFixable.includes(ruleId);
      }),
      declaredAutoFixableRuleIdsWithoutWiredFixer: facts.rules.declaredAutoFixable.filter(function (
        ruleId,
      ) {
        return !fixerRuleIds.includes(ruleId);
      }),
    },
    rules: ruleRows,
    reporterIds: reporterRows,
    fixers: fixerRows,
    detectors: detectorRows,
    surfaces: surfaceRows,
    suppressionSearch: facts.suppressionSearch,
    suppressionHits: facts.suppressionHits,
    downstreamSlices: DOWNSTREAM_SLICES,
    fixtureHashes: facts.fixtureHashes,
  };
}

export function buildConsumerDocument(
  disposition: FreezeDispositionDocument,
): Record<string, unknown> {
  validateConsumerEvidence(CONSUMER_SNAPSHOT);
  return {
    schemaVersion: 2,
    generatedAt: disposition.generatedAt,
    sourceFingerprint: disposition.sourceFingerprint,
    authorityIssue: disposition.authority.issue,
    ...CONSUMER_SNAPSHOT,
    downstreamSlices: disposition.downstreamSlices,
  };
}

export function buildFreezeMarkdown(disposition: FreezeDispositionDocument): string {
  return formatMarkdown(disposition);
}
