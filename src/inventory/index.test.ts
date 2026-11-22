import { describe, expect, it } from "vitest";
import { CONSUMER_SNAPSHOT } from "./constants.js";
import {
  assertBehaviorContractCatalog,
  assertExactDispositionCoverage,
  assertSourceFingerprint,
  buildFreezeDispositionDocument,
  classifySuppressionHit,
  collectSourceFacts,
  discoverBehaviorSurfaces,
  validateConsumerEvidence,
} from "./index.js";
import type { ConsumerEvidence, SourceFacts } from "./types.js";

describe("bedrock freeze inventory", function () {
  const repoRoot = process.cwd();
  const facts = collectSourceFacts(repoRoot);
  const doc = buildFreezeDispositionDocument(facts, "2026-11-22T00:00:00.000Z");

  it("captures exact source-derived denominators", function () {
    expect(doc.denominators).toEqual({
      registryRuleIds: 53,
      reporterIds: 9,
      fixerExports: 16,
      detectorExports: 37,
      detectorWired: 35,
      detectorUnwired: 2,
      fixturePairs: 79,
      reporterContracts: 12,
      cliContracts: 21,
      packageIdentities: 2,
      packageBins: 1,
      packageScripts: 12,
      scriptFiles: 3,
      generatedArtifacts: 3,
      workflows: 2,
      workflowJobs: 3,
      suppressionSearchHits: 70,
      suppressionMechanisms: 0,
    });
    expect(doc.surfaces).toHaveLength(
      doc.denominators.reporterContracts +
        doc.denominators.cliContracts +
        doc.denominators.packageIdentities +
        doc.denominators.packageBins +
        doc.denominators.packageScripts +
        doc.denominators.scriptFiles +
        doc.denominators.generatedArtifacts +
        doc.denominators.workflows +
        doc.denominators.workflowJobs,
    );
  });

  it("records only non-ID candidate concepts pending issue 96", function () {
    const candidates = doc.rules.filter(function (row) {
      return row.disposition === "candidate-pending-96";
    });
    expect(candidates).toHaveLength(12);
    for (const candidate of candidates) {
      expect(candidate.proposedCruxId).toBeNull();
      expect(candidate.targetConcept).not.toBeNull();
      expect(candidate.targetConcept).not.toMatch(/^crux\//);
    }
  });

  it("captures auto-fix mismatch and unwired detector evidence", function () {
    expect(doc.mismatchEvidence.wiredFixerRuleIdsNotDeclaredAutoFixable).toEqual([
      "no-default-parameters",
      "no-for-each",
      "no-for-in",
      "no-has-own-property",
      "no-mutating-sort",
      "no-sort-without-comparator",
      "no-sparse-arrays",
      "no-while",
    ]);
    expect(doc.mismatchEvidence.declaredAutoFixableRuleIdsWithoutWiredFixer).toEqual([
      "no-array-pop",
      "no-array-shift",
    ]);
    expect(
      doc.detectors
        .filter(function (row) {
          return !row.wiredInReporter;
        })
        .map(function (row) {
          return row.id;
        })
        .sort(),
    ).toEqual(["detectTaggedTemplateLiterals", "detectUpdateExpressionInExpression"]);
  });

  it("rejects unknown source rows", function () {
    const driftedFacts: SourceFacts = structuredClone(facts);
    driftedFacts.fixers.exported.push("unknownFixer");
    expect(function () {
      buildFreezeDispositionDocument(driftedFacts, "2026-11-22T00:00:00.000Z");
    }).toThrow("Missing fixer disposition mapping for: unknownFixer");
  });

  it("rejects added or changed CLI and reporter behavior", function () {
    const source = "export function run(): number { return 0; }";
    const discovered = discoverBehaviorSurfaces(source, "src/cli/fixture.ts", "cli-contract");
    const catalog = {
      [discovered[0]!.id]: discovered[0]!.sourceSha256!,
    };

    expect(function () {
      assertBehaviorContractCatalog(
        discoverBehaviorSurfaces(
          "export function run(): number { if (true) { return 1; } return 0; }",
          "src/cli/fixture.ts",
          "cli-contract",
        ),
        catalog,
      );
    }).toThrow("changed: cli:declaration:src/cli/fixture.ts:run");

    expect(function () {
      assertBehaviorContractCatalog(
        discoverBehaviorSurfaces(
          source + "\nexport function newlyAdded(): void {}",
          "src/cli/fixture.ts",
          "cli-contract",
        ),
        catalog,
      );
    }).toThrow("unknown: cli:declaration:src/cli/fixture.ts:newlyAdded");
  });

  it("rejects duplicate, missing, and unknown disposition rows", function () {
    expect(function () {
      assertExactDispositionCoverage(["a", "b"], [{ id: "a" }, { id: "a" }, { id: "c" }], "Test");
    }).toThrow("duplicate rows: a; missing: b; unknown: c");
  });

  it("rejects stale source metadata", function () {
    expect(function () {
      assertSourceFingerprint("sha256:stale", facts.sourceFingerprint);
    }).toThrow("Stale source fingerprint");
  });

  it("rejects consumer query-result drift", function () {
    const drifted = structuredClone(CONSUMER_SNAPSHOT) as ConsumerEvidence;
    drifted.results.push({
      queryId: "unknown-query",
      repository: "clockwork-kitten/standards",
      revision: drifted.repositoryRevisions["clockwork-kitten/standards"] ?? "",
      path: "new-consumer.ts",
      classification: "functional-consumer",
      disposition: "unmapped",
    });
    expect(function () {
      validateConsumerEvidence(drifted);
    }).toThrow("unknown query");

    const stale = structuredClone(CONSUMER_SNAPSHOT) as ConsumerEvidence;
    stale.repositoryRevisions["clockwork-kitten/standards"] = "stale";
    stale.results = stale.results.map(function (result) {
      return result.repository === "clockwork-kitten/standards"
        ? { ...result, revision: "stale" }
        : result;
    });
    expect(function () {
      validateConsumerEvidence(stale);
    }).toThrow("do not match pinned default-branch heads");

    const missing = structuredClone(CONSUMER_SNAPSHOT) as ConsumerEvidence;
    missing.results.shift();
    expect(function () {
      validateConsumerEvidence(missing);
    }).toThrow("do not match pinned query evidence");

    const unclassified = structuredClone(CONSUMER_SNAPSHOT) as ConsumerEvidence;
    const firstResult = unclassified.results[0]!;
    unclassified.results[0] = {
      ...firstResult,
      classification: undefined as never,
    };
    expect(function () {
      validateConsumerEvidence(unclassified);
    }).toThrow("unclassified");
  });

  it("rejects unclassified repository-wide suppression drift", function () {
    expect(
      classifySuppressionHit(
        "knip.json",
        "ignore",
        '  "ignore": ["src/__fixtures__/**"]',
      ),
    ).toBe("external-tool-config");
    expect(function () {
      classifySuppressionHit("package.json", "disable", '"disable-bedrock": true');
    }).toThrow("Unclassified suppression search hit");
    expect(
      classifySuppressionHit(
        "src/inventory/collect.ts",
        "suppress",
        'import type { SuppressionHit } from "./types.js";',
      ),
    ).toBe("scanner-implementation");
    expect(function () {
      classifySuppressionHit(
        "src/inventory/escape.ts",
        "disable",
        "// eslint-disable security/detect-child-process",
      );
    }).toThrow("Unclassified suppression search hit");
    expect(doc.denominators.suppressionMechanisms).toBe(0);
  });

  it("limits downstream slices to S/M/L only", function () {
    for (const slice of doc.downstreamSlices) {
      expect(["S", "M", "L"]).toContain(slice.size);
    }
  });
});
