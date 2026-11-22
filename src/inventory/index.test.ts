import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { buildFreezeDispositionDocument, collectSourceFacts } from "./index.js";

function currentRevision(): string {
  return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
}

describe("bedrock freeze inventory", function () {
  const repoRoot = process.cwd();
  const facts = collectSourceFacts(repoRoot, currentRevision());
  const doc = buildFreezeDispositionDocument(facts, "2026-11-22T00:00:00.000Z");

  it("captures expected denominators", function () {
    expect(doc.denominators.registryRuleIds).toBe(53);
    expect(doc.denominators.reporterIds).toBe(9);
    expect(doc.denominators.fixerExports).toBe(16);
    expect(doc.denominators.detectorExports).toBe(37);
    expect(doc.denominators.detectorWired).toBe(35);
    expect(doc.denominators.detectorUnwired).toBe(2);
    expect(doc.denominators.fixturePairs).toBe(79);
    expect(doc.denominators.packageScripts).toBe(10);
    expect(doc.denominators.generatedArtifacts).toBe(3);
    expect(doc.denominators.workflows).toBe(2);
    expect(doc.denominators.workflowJobs).toBe(3);
    expect(doc.denominators.suppressions).toBe(0);
  });

  it("captures auto-fix mismatch evidence", function () {
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
  });

  it("tracks unwired detector symbols explicitly", function () {
    const unwired = doc.detectors
      .filter(function (row) {
        return !row.wiredInReporter;
      })
      .map(function (row) {
        return row.id;
      })
      .sort();
    expect(unwired).toEqual(["detectTaggedTemplateLiterals", "detectUpdateExpressionInExpression"]);
  });

  it("includes a disposition row for every registry rule", function () {
    const rowIds = doc.rules.map(function (row) {
      return row.legacyRuleId;
    });
    expect(new Set(rowIds).size).toBe(53);
  });

  it("limits downstream slices to S/M/L only", function () {
    for (const slice of doc.downstreamSlices) {
      expect(["S", "M", "L"]).toContain(slice.size);
    }
  });
});
