import type jscodeshift from "jscodeshift";
import type { ViolationCollector, ViolationPass } from "../../transformer/index.js";

type NodeWithLoc = { loc?: { start: { line: number; column: number } } | null };

const CANONICAL_CATEGORY = "canonical" as const;

const CLASS_DECLARATION_MESSAGE =
  "class syntax is banned — use a factory function returning a plain object";
const CLASS_EXPRESSION_MESSAGE =
  "class syntax is banned — use a factory function returning a plain object";
const THIS_EXPRESSION_MESSAGE =
  "this is banned — use explicit parameter passing";

function locOf(node: NodeWithLoc): { line: number; column: number } {
  const loc = node.loc;
  const line = loc !== null && loc !== undefined ? loc.start.line : 0;
  const column = loc !== null && loc !== undefined ? loc.start.column : 0;
  return { line, column };
}

export const detectClassDeclaration: ViolationPass =
  function detectClassDeclaration(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.ClassDeclaration).forEach(function (path) {
      const { line, column } = locOf(path.node);
      collector.add({
        line,
        column,
        message: CLASS_DECLARATION_MESSAGE,
        category: CANONICAL_CATEGORY,
      });
    });
  };

export const detectClassExpression: ViolationPass =
  function detectClassExpression(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.ClassExpression).forEach(function (path) {
      const { line, column } = locOf(path.node);
      collector.add({
        line,
        column,
        message: CLASS_EXPRESSION_MESSAGE,
        category: CANONICAL_CATEGORY,
      });
    });
  };

export const detectThisExpression: ViolationPass =
  function detectThisExpression(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.ThisExpression).forEach(function (path) {
      const { line, column } = locOf(path.node);
      collector.add({
        line,
        column,
        message: THIS_EXPRESSION_MESSAGE,
        category: CANONICAL_CATEGORY,
      });
    });
  };
