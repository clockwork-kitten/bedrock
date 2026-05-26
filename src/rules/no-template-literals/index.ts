import type jscodeshift from "jscodeshift";
import type { ExpressionKind } from "ast-types/lib/gen/kinds.js";
import type {
  TransformPass,
  ViolationCollector,
  ViolationPass,
} from "../../transformer/index.js";

type NodeWithLoc = { loc?: { start: { line: number; column: number } } | null };

const TAGGED_TEMPLATE_MESSAGE =
  "Tagged template literals are banned — too complex to rewrite automatically";
const CANONICAL_CATEGORY = "canonical" as const;

function locOf(node: NodeWithLoc): { line: number; column: number } {
  const loc = node.loc;
  const line = loc !== null && loc !== undefined ? loc.start.line : 0;
  const column = loc !== null && loc !== undefined ? loc.start.column : 0;
  return { line, column };
}

function buildConcatenation(
  quasis: jscodeshift.TemplateElement[],
  expressions: jscodeshift.ASTNode[],
  j: jscodeshift.JSCodeshift,
): ExpressionKind {
  const parts: ExpressionKind[] = [];

  for (let i = 0; i < quasis.length; i++) {
    const cooked = quasis[i].value.cooked;
    if (cooked !== null && cooked !== undefined && cooked !== "") {
      parts.push(j.stringLiteral(cooked));
    }
    if (i < expressions.length) {
      const expr = expressions[i];
      if (j.Expression.check(expr)) {
        parts.push(expr as ExpressionKind);
      }
    }
  }

  if (parts.length === 0) {
    return j.stringLiteral("");
  }

  let result = parts[0];
  for (let i = 1; i < parts.length; i++) {
    result = j.binaryExpression("+", result, parts[i]);
  }
  return result;
}

export const rewriteTemplateLiterals: TransformPass =
  function rewriteTemplateLiterals(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
  ): void {
    root
      .find(j.TemplateLiteral)
      .filter(function (path) {
        // Skip tagged templates — handled by ViolationPass
        return !j.TaggedTemplateExpression.check(path.parent.node);
      })
      .forEach(function (path) {
        const { quasis, expressions } = path.node;
        const replacement = buildConcatenation(quasis, expressions, j);
        path.replace(replacement);
      });
  };

export const detectTaggedTemplateLiterals: ViolationPass =
  function detectTaggedTemplateLiterals(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.TaggedTemplateExpression).forEach(function (path) {
      const { line, column } = locOf(path.node);
      collector.add({
        line,
        column,
        message: TAGGED_TEMPLATE_MESSAGE,
        category: CANONICAL_CATEGORY,
      });
    });
  };
