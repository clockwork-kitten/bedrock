import type jscodeshift from "jscodeshift";
import type { ViolationCollector, ViolationPass } from "../../transformer/index.js";

const VIOLATION_CATEGORY = "canonical" as const;

const TERNARY_MESSAGE =
  "ternary expression is banned — rewrite as an if/else block";

const SWITCH_MESSAGE =
  "switch statement is banned — rewrite as an if/else chain or object lookup";

const LOGICAL_OR_MESSAGE =
  '|| used for default value is banned — use an explicit if (x === null || x === undefined) check';

const LOGICAL_AND_MESSAGE =
  "&& used for conditional execution is banned — use an explicit if block";

const NULLISH_COALESCING_MESSAGE =
  "?? nullish coalescing is banned — use an explicit if (x === null || x === undefined) check";

const OPTIONAL_CHAIN_MESSAGE =
  "?. optional chaining is banned — use an explicit null/undefined check";

export const detectTernary: ViolationPass = function detectTernary(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.ConditionalExpression).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: TERNARY_MESSAGE, category: VIOLATION_CATEGORY });
  });
};

export const detectSwitch: ViolationPass = function detectSwitch(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.SwitchStatement).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: SWITCH_MESSAGE, category: VIOLATION_CATEGORY });
  });
};

export const detectLogicalOrDefault: ViolationPass = function detectLogicalOrDefault(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root
    .find(j.LogicalExpression, { operator: "||" })
    .forEach(function (path) {
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: LOGICAL_OR_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

export const detectLogicalAndExec: ViolationPass = function detectLogicalAndExec(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root
    .find(j.LogicalExpression, { operator: "&&" })
    .forEach(function (path) {
      // Only flag `&&` when used as a standalone expression statement (i.e. `cond && doThing()`).
      // Using `&&` inside an `if` / `while` / ternary condition as a compound boolean test is permitted.
      if (!j.ExpressionStatement.check(path.parent.node)) {
        return;
      }
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: LOGICAL_AND_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

export const detectNullishCoalescing: ViolationPass = function detectNullishCoalescing(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root
    .find(j.LogicalExpression, { operator: "??" })
    .forEach(function (path) {
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: NULLISH_COALESCING_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

export const detectOptionalChain: ViolationPass = function detectOptionalChain(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.OptionalMemberExpression).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: OPTIONAL_CHAIN_MESSAGE, category: VIOLATION_CATEGORY });
  });
  root.find(j.OptionalCallExpression).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: OPTIONAL_CHAIN_MESSAGE, category: VIOLATION_CATEGORY });
  });
};
