import type jscodeshift from "jscodeshift";
import type { ExpressionKind } from "ast-types/lib/gen/kinds.js";
import type { TransformPass, ViolationCollector, ViolationPass } from "../../transformer/index.js";

// ── Constants ─────────────────────────────────────────────────────────────

const COMPOUND_ASSIGN_OPERATORS = ["+=", "-=", "*=", "/="] as const;
type CompoundAssignOperator = (typeof COMPOUND_ASSIGN_OPERATORS)[number];

const COMPOUND_TO_BINARY: Record<CompoundAssignOperator, "+" | "-" | "*" | "/"> = {
  "+=": "+",
  "-=": "-",
  "*=": "*",
  "/=": "/",
};

const UPDATE_USED_AS_EXPRESSION_MESSAGE =
  "x++ / ++x used as an expression (return value is used) — cannot auto-fix; manually rewrite using a temporary variable";
const VIOLATION_CATEGORY = "canonical" as const;

// ── TransformPass: compound assignment → explicit assignment ──────────────

export const compoundAssignToExplicit: TransformPass = function compoundAssignToExplicit(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root.find(j.AssignmentExpression).forEach(function (path) {
    const op = path.node.operator as string;
    if (!COMPOUND_ASSIGN_OPERATORS.includes(op as CompoundAssignOperator)) {
      return;
    }
    const compound = op as CompoundAssignOperator;
    const binaryOp = COMPOUND_TO_BINARY[compound];
    path.node.operator = "=";
    path.node.right = j.binaryExpression(
      binaryOp,
      path.node.left as unknown as ExpressionKind,
      path.node.right,
    );
  });
};

// ── TransformPass: standalone UpdateExpression → explicit assignment ──────
//
// Only rewrites when the UpdateExpression is a direct ExpressionStatement
// (i.e. the return value is not used). Expression-context updates are flagged
// by detectUpdateExpressionInExpression below.

export const updateExpressionToExplicit: TransformPass = function updateExpressionToExplicit(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root.find(j.ExpressionStatement).forEach(function (path) {
    const expr = path.node.expression;
    if (!j.UpdateExpression.check(expr)) {
      return;
    }
    const op = expr.operator === "++" ? "+" : "-";
    const argument = expr.argument as ExpressionKind;
    const assignment = j.assignmentExpression(
      "=",
      argument as unknown as Parameters<jscodeshift.JSCodeshift["assignmentExpression"]>[1],
      j.binaryExpression(op, argument, j.literal(1)),
    );
    path.node.expression = assignment;
  });
};

// ── ViolationPass: UpdateExpression used as expression ───────────────────

export const detectUpdateExpressionInExpression: ViolationPass =
  function detectUpdateExpressionInExpression(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.UpdateExpression).forEach(function (path) {
      // If the parent is an ExpressionStatement, it's standalone — safe to auto-fix
      if (j.ExpressionStatement.check(path.parent.node)) {
        return;
      }
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: UPDATE_USED_AS_EXPRESSION_MESSAGE,
        category: VIOLATION_CATEGORY,
      });
    });
  };
