import type jscodeshift from "jscodeshift";
import type { ViolationCollector, ViolationPass } from "../../transformer/index.js";

const BANNED_PROMISE_METHODS = ["race", "any"] as const;
type BannedPromiseMethod = (typeof BANNED_PROMISE_METHODS)[number];

const PROMISE_METHOD_MESSAGES: Record<BannedPromiseMethod, string> = {
  race: "Use Promise.allSettled() with explicit winner selection logic instead of Promise.race()",
  any: "Use Promise.allSettled() with explicit first-success logic instead of Promise.any()",
};

const VIOLATION_CATEGORY_CANONICAL = "canonical" as const;
const VIOLATION_CATEGORY_EXTERNAL_BOUNDARY = "external-boundary" as const;

const NEW_PROMISE_MESSAGE =
  "Prefer async functions over new Promise(). Exception: wrapping callback-based APIs at external boundaries.";

const BARE_AWAIT_MESSAGE =
  "Wrap await in try/catch to handle rejections explicitly.";

function isBannedPromiseMethod(name: string): name is BannedPromiseMethod {
  return (BANNED_PROMISE_METHODS as readonly string[]).includes(name);
}

function isInsideTryCatch(path: jscodeshift.ASTPath): boolean {
  let current = path.parent;
  while (current) {
    if (current.node.type === "TryStatement") {
      return true;
    }
    // Stop at function boundaries — a try/catch in an outer function doesn't cover this await
    if (
      current.node.type === "FunctionDeclaration" ||
      current.node.type === "FunctionExpression" ||
      current.node.type === "ArrowFunctionExpression"
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

function getLocation(
  node: jscodeshift.ASTNode,
): { line: number; column: number } {
  const loc = "loc" in node ? (node as { loc?: { start: { line: number; column: number } } }).loc : undefined;
  return {
    line: loc !== undefined && loc !== null ? loc.start.line : 0,
    column: loc !== undefined && loc !== null ? loc.start.column : 0,
  };
}

export const detectBannedPromiseMethods: ViolationPass = function detectBannedPromiseMethods(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root
    .find(j.CallExpression, {
      callee: { type: "MemberExpression" },
    })
    .forEach(function (path) {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) return;

      const object = callee.object;
      const property = callee.property;

      if (!j.Identifier.check(object) || object.name !== "Promise") return;
      if (!j.Identifier.check(property)) return;

      const methodName = property.name;
      if (!isBannedPromiseMethod(methodName)) return;

      const { line, column } = getLocation(path.node);
      collector.add({
        line,
        column,
        message: PROMISE_METHOD_MESSAGES[methodName],
        category: VIOLATION_CATEGORY_CANONICAL,
      });
    });
};

export const detectNewPromise: ViolationPass = function detectNewPromise(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.NewExpression).forEach(function (path) {
    const callee = path.node.callee;
    if (!j.Identifier.check(callee) || callee.name !== "Promise") return;

    const { line, column } = getLocation(path.node);
    collector.add({
      line,
      column,
      message: NEW_PROMISE_MESSAGE,
      category: VIOLATION_CATEGORY_EXTERNAL_BOUNDARY,
    });
  });
};

export const detectBareAwait: ViolationPass = function detectBareAwait(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.AwaitExpression).forEach(function (path) {
    if (isInsideTryCatch(path)) return;

    const { line, column } = getLocation(path.node);
    collector.add({
      line,
      column,
      message: BARE_AWAIT_MESSAGE,
      category: VIOLATION_CATEGORY_CANONICAL,
    });
  });
};
