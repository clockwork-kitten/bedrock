import jscodeshift from "jscodeshift";
import { parseSource } from "../transformer/parse.js";
import type { Violation, ViolationCollector } from "../transformer/index.js";
import { violationPasses } from "./rules.js";

export type AnnotatedViolation = Violation & {
  filePath: string;
  ruleName: string;
};

export type ReportResult = {
  filePath: string;
  violations: AnnotatedViolation[];
  isGrounded: boolean;
};

function createViolationCollector(): ViolationCollector {
  const violations: Violation[] = [];
  return {
    add(violation: Violation): void {
      violations.push(violation);
    },
    all(): Violation[] {
      return violations.slice();
    },
  };
}

export function runReport(filePath: string, source: string): ReportResult {
  const parser = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "ts" : "babel";
  const j = jscodeshift.withParser(parser);
  const root = parseSource(source, parser);

  const violations: AnnotatedViolation[] = [];

  for (const { ruleName, pass } of violationPasses) {
    const collector = createViolationCollector();
    pass(root, j, collector);
    for (const violation of collector.all()) {
      violations.push({ ...violation, filePath, ruleName });
    }
  }

  const isGrounded = violations.every(function (v) {
    return v.category !== "external-boundary";
  });

  return { filePath, violations, isGrounded };
}
