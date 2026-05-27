import jscodeshift from "jscodeshift";
import { parseSource } from "./parse.js";
import { printSource } from "./print.js";
import type {
  TransformOptions,
  TransformResult,
  Violation,
  ViolationCollector,
} from "./types.js";

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

export function applyTransform(
  source: string,
  options: TransformOptions,
): TransformResult {
  const j = jscodeshift.withParser(options.parser);
  const root = parseSource(source, options.parser);

  for (const pass of options.passes) {
    pass(root, j);
  }

  const collector = createViolationCollector();

  let violationPasses = options.violationPasses;
  if (violationPasses === null) {
    violationPasses = [];
  }
  if (violationPasses === undefined) {
    violationPasses = [];
  }
  for (const pass of violationPasses) {
    pass(root, j, collector);
  }

  const output = printSource(root);
  const changed = output !== source;

  return { source: output, changed, violations: collector.all() };
}
