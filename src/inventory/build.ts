import {
  CONSUMER_SNAPSHOT,
  DETECTOR_TO_RULE_IDS,
  DOWNSTREAM_SLICES,
  FIXER_TO_RULE_IDS,
  REPORTER_IDS,
  SURFACE_ROWS,
  resolveRuleDisposition,
} from "./constants.js";
import type { FreezeDispositionDocument, InventoryRow, SourceFacts } from "./types.js";

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function buildRuleFixerMap(wiredFixers: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const fixerSymbol of wiredFixers) {
    const rules = FIXER_TO_RULE_IDS[fixerSymbol] ?? [];
    for (const ruleId of rules) {
      const current = map.get(ruleId) ?? [];
      map.set(ruleId, sortUnique([...current, fixerSymbol]));
    }
  }
  return map;
}

function buildFixerRows(facts: SourceFacts): InventoryRow[] {
  return facts.fixers.exported.map(function (symbol) {
    const ruleIds = FIXER_TO_RULE_IDS[symbol] ?? [];
    const inheritedDisposition = ruleIds.some(function (ruleId) {
      return resolveRuleDisposition(ruleId).disposition === "candidate-pending-96";
    })
      ? "candidate-pending-96"
      : "dropped";
    return {
      id: symbol,
      kind: "fixer",
      disposition: inheritedDisposition,
      rationale:
        "Bedrock AST fixer is retired; approved behaviors are reimplemented under Crucible ownership (#133).",
      proposedOwner: inheritedDisposition === "candidate-pending-96" ? "crucible" : null,
      proposedCruxId: null,
    };
  });
}

function buildDetectorRows(facts: SourceFacts): Array<InventoryRow & { reporterIds: string[]; wiredInReporter: boolean }> {
  const wiringBySymbol = new Map<string, string[]>();
  for (const row of facts.detectors.wiredInReporter) {
    const current = wiringBySymbol.get(row.symbol) ?? [];
    wiringBySymbol.set(row.symbol, sortUnique([...current, row.reporterId]));
  }

  return facts.detectors.exported.map(function (symbol) {
    const reporterIds = wiringBySymbol.get(symbol) ?? [];
    const ruleIds = DETECTOR_TO_RULE_IDS[symbol] ?? [];
    const inheritedDisposition = ruleIds.some(function (ruleId) {
      return resolveRuleDisposition(ruleId).disposition === "candidate-pending-96";
    })
      ? "candidate-pending-96"
      : "dropped";
    const wiredInReporter = reporterIds.length > 0;

    return {
      id: symbol,
      kind: "detector",
      disposition: inheritedDisposition,
      rationale: wiredInReporter
        ? "Detector inherits disposition of mapped legacy rule IDs."
        : "Dropped-unreachable: exported detector is not wired in reporter pass registration.",
      proposedOwner: inheritedDisposition === "candidate-pending-96" ? "crucible" : null,
      proposedCruxId: null,
      reporterIds,
      wiredInReporter,
    };
  });
}

function buildReporterRows(): InventoryRow[] {
  return REPORTER_IDS.map(function (id) {
    return {
      id,
      kind: "reporter-id",
      disposition: "dropped",
      rationale: "Dropped: coarse Bedrock reporter IDs are not preserved as aliases in MVP clean break.",
      proposedOwner: null,
      proposedCruxId: null,
    };
  });
}

function buildSurfaceRows(): InventoryRow[] {
  return SURFACE_ROWS.map(function (row) {
    return {
      id: row.id,
      kind: row.kind,
      disposition: row.disposition,
      rationale: row.rationale,
      proposedOwner: null,
      proposedCruxId: null,
    };
  });
}

function formatMarkdown(doc: FreezeDispositionDocument): string {
  const lines: string[] = [];
  lines.push("# Bedrock T0 Freeze Inventory");
  lines.push("");
  lines.push(
    "Authoritative source: `docs/bedrock-disposition.json` + `docs/bedrock-consumers.json`.",
  );
  lines.push("");
  lines.push("## Denominators");
  lines.push("");
  lines.push("| Surface | Count |");
  lines.push("|---|---:|");
  lines.push("| Registry rule IDs | " + doc.denominators.registryRuleIds + " |");
  lines.push("| Runtime reporter IDs | " + doc.denominators.reporterIds + " |");
  lines.push("| Fixer exports | " + doc.denominators.fixerExports + " |");
  lines.push(
    "| Detector exports (wired/unwired) | " +
      doc.denominators.detectorExports +
      " (" +
      doc.denominators.detectorWired +
      "/" +
      doc.denominators.detectorUnwired +
      ") |",
  );
  lines.push("| Fixture pairs | " + doc.denominators.fixturePairs + " |");
  lines.push("| Package scripts | " + doc.denominators.packageScripts + " |");
  lines.push("| Generated artifacts | " + doc.denominators.generatedArtifacts + " |");
  lines.push(
    "| Workflows (jobs) | " + doc.denominators.workflows + " (" + doc.denominators.workflowJobs + ") |",
  );
  lines.push("| Suppression mechanisms | " + doc.denominators.suppressions + " |");
  lines.push("");
  lines.push("## Registry-vs-wired fixer mismatch");
  lines.push("");
  lines.push("- Declared auto-fixable IDs: " + doc.mismatchEvidence.declaredAutoFixableRuleIds.length);
  lines.push(
    "- Wired fixer symbols: " + doc.mismatchEvidence.wiredFixerSymbols.length,
  );
  lines.push(
    "- Wired fixer rule IDs not declared auto-fixable: " +
      doc.mismatchEvidence.wiredFixerRuleIdsNotDeclaredAutoFixable.join(", "),
  );
  lines.push(
    "- Declared auto-fixable IDs without wired fixer: " +
      doc.mismatchEvidence.declaredAutoFixableRuleIdsWithoutWiredFixer.join(", "),
  );
  lines.push("");
  lines.push("## Downstream slices (S/M/L only)");
  lines.push("");
  lines.push("| Slice | Repo | Size | Status |");
  lines.push("|---|---|---|---|");
  for (const slice of doc.downstreamSlices) {
    lines.push(
      "| " + slice.id + " | " + slice.repository + " | " + slice.size + " | " + slice.status + " |",
    );
  }
  lines.push("");
  lines.push("## Reproduction commands");
  lines.push("");
  lines.push("```sh");
  lines.push("bun run inventory:generate");
  lines.push("bun run inventory:check");
  lines.push("```");
  lines.push("");
  lines.push("## Consumer discovery bounds");
  lines.push("");
  lines.push(CONSUMER_SNAPSHOT.boundedUniverse);
  return lines.join("\n") + "\n";
}

export function buildFreezeDispositionDocument(
  facts: SourceFacts,
  generatedAt: string,
): FreezeDispositionDocument {
  const missingReporter = REPORTER_IDS.filter(function (id) {
    return !facts.reporterIds.includes(id);
  });
  if (missingReporter.length > 0) {
    throw new Error("Missing reporter IDs from source wiring: " + missingReporter.join(", "));
  }

  const ruleFixerMap = buildRuleFixerMap(facts.fixers.wiredInCli);
  const ruleRows = facts.rules.ids
    .map(function (ruleId) {
      const disposition = resolveRuleDisposition(ruleId);
      return {
        ...disposition,
        declaredAutoFixable: facts.rules.declaredAutoFixable.includes(ruleId),
        fixerSymbols: ruleFixerMap.get(ruleId) ?? [],
      };
    })
    .sort(function (a, b) {
      return a.legacyRuleId.localeCompare(b.legacyRuleId);
    });

  const fixerRuleIds = sortUnique(
    facts.fixers.wiredInCli.flatMap(function (symbol) {
      return FIXER_TO_RULE_IDS[symbol] ?? [];
    }),
  );
  const wiredFixerRuleIdsNotDeclaredAutoFixable = fixerRuleIds.filter(function (ruleId) {
    return !facts.rules.declaredAutoFixable.includes(ruleId);
  });
  const declaredAutoFixableRuleIdsWithoutWiredFixer = facts.rules.declaredAutoFixable.filter(function (
    ruleId,
  ) {
    return !fixerRuleIds.includes(ruleId);
  });

  const workflowJobCount = facts.workflows.reduce(function (sum, workflow) {
    return sum + workflow.jobs.length;
  }, 0);
  const wiredDetectorSymbols = sortUnique(
    facts.detectors.wiredInReporter.map(function (row) {
      return row.symbol;
    }),
  );

  return {
    schemaVersion: 1,
    generatedAt,
    sourceRevision: facts.revision,
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
      packageScripts: facts.packageScripts.length,
      generatedArtifacts: facts.generatedArtifacts.length,
      workflows: facts.workflows.length,
      workflowJobs: workflowJobCount,
      suppressions: facts.suppressionMechanismsCount,
    },
    mismatchEvidence: {
      declaredAutoFixableRuleIds: facts.rules.declaredAutoFixable,
      wiredFixerSymbols: facts.fixers.wiredInCli,
      wiredFixerRuleIdsNotDeclaredAutoFixable,
      declaredAutoFixableRuleIdsWithoutWiredFixer,
    },
    rules: ruleRows,
    reporterIds: buildReporterRows(),
    fixers: buildFixerRows(facts),
    detectors: buildDetectorRows(facts),
    surfaces: buildSurfaceRows(),
    downstreamSlices: DOWNSTREAM_SLICES,
    fixtureHashes: facts.fixtureHashes,
  };
}

export function buildConsumerDocument(disposition: FreezeDispositionDocument): Record<string, unknown> {
  return {
    schemaVersion: 1,
    generatedAt: disposition.generatedAt,
    sourceRevision: disposition.sourceRevision,
    authorityIssue: disposition.authority.issue,
    ...CONSUMER_SNAPSHOT,
    downstreamSlices: disposition.downstreamSlices,
  };
}

export function buildFreezeMarkdown(disposition: FreezeDispositionDocument): string {
  return formatMarkdown(disposition);
}

