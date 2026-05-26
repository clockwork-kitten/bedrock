import type jscodeshift from "jscodeshift";

export type TransformPass = (
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
) => void;

export type ViolationCategory = "canonical" | "type-level" | "external-boundary";

export type Violation = {
  line: number;
  column: number;
  message: string;
  category: ViolationCategory;
};

export type ViolationCollector = {
  add(violation: Violation): void;
  all(): Violation[];
};

export type ViolationPass = (
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
) => void;

export type TransformOptions = {
  parser: "babel" | "ts";
  passes: TransformPass[];
  violationPasses?: ViolationPass[];
};

export type TransformResult = {
  source: string;
  changed: boolean;
  violations: Violation[];
};
