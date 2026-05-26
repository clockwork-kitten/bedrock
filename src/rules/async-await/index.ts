import type jscodeshift from "jscodeshift";
import type { ViolationCollector, ViolationPass } from "../../transformer/index.js";

const BANNED_METHODS = ["then", "catch", "finally"] as const;
type BannedMethod = (typeof BANNED_METHODS)[number];

const VIOLATION_MESSAGES: Record<BannedMethod, string> = {
  then: "Use async/await with try/catch instead of .then()",
  catch: "Use async/await with try/catch instead of .catch()",
  finally: "Use try/catch/finally instead of .finally()",
};

const VIOLATION_CATEGORY = "canonical" as const;

function isBannedMethod(name: string): name is BannedMethod {
  return (BANNED_METHODS as readonly string[]).includes(name);
}

export const detectPromiseChains: ViolationPass = function detectPromiseChains(
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
      if (!j.MemberExpression.check(callee)) {
        return;
      }
      const property = callee.property;
      if (!j.Identifier.check(property)) {
        return;
      }
      const methodName = property.name;
      if (!isBannedMethod(methodName)) {
        return;
      }
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: VIOLATION_MESSAGES[methodName],
        category: VIOLATION_CATEGORY,
      });
    });
};
