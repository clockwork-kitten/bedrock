import type jscodeshift from "jscodeshift";
import type { TransformPass } from "../../transformer/index.js";

const LOOSE_EQUALITY = "==";
const LOOSE_INEQUALITY = "!=";
const STRICT_EQUALITY = "===";
const STRICT_INEQUALITY = "!==";

export const equalityToStrict: TransformPass = function equalityToStrict(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root
    .find(j.BinaryExpression)
    .filter(function (path) {
      return (
        path.node.operator === LOOSE_EQUALITY ||
        path.node.operator === LOOSE_INEQUALITY
      );
    })
    .forEach(function (path) {
      if (path.node.operator === LOOSE_EQUALITY) {
        path.node.operator = STRICT_EQUALITY;
      } else {
        path.node.operator = STRICT_INEQUALITY;
      }
    });
};
