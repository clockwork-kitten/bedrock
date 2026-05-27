import type jscodeshift from "jscodeshift";
import type { StatementKind, PatternKind } from "ast-types/lib/gen/kinds.js";
import type {
  TransformPass,
  ViolationCollector,
  ViolationPass,
} from "../../transformer/index.js";

type NodeWithLoc = { loc?: { start: { line: number; column: number } } | null };

// ── Helpers ───────────────────────────────────────────────────────────────

function locOf(
  node: NodeWithLoc,
): { line: number; column: number } {
  const loc = node.loc;
  const line = loc !== null && loc !== undefined ? loc.start.line : 0;
  const column = loc !== null && loc !== undefined ? loc.start.column : 0;
  return { line, column };
}

function arrowToFunction(
  path: jscodeshift.ASTPath<jscodeshift.ArrowFunctionExpression>,
  j: jscodeshift.JSCodeshift,
  inferredName: string | null,
): jscodeshift.FunctionExpression {
  const arrow = path.node;
  const body = j.BlockStatement.check(arrow.body)
    ? arrow.body
    : j.blockStatement([j.returnStatement(arrow.body)]);

  const id =
    inferredName !== null ? j.identifier(inferredName) : null;

  const fn = j.functionExpression(id, arrow.params, body);
  fn.async = arrow.async;
  return fn;
}

function inferNameFromParent(
  path: jscodeshift.ASTPath<jscodeshift.ArrowFunctionExpression>,
  j: jscodeshift.JSCodeshift,
): string | null {
  const parent = path.parent;
  if (
    j.VariableDeclarator.check(parent.node) &&
    j.Identifier.check(parent.node.id)
  ) {
    return parent.node.id.name;
  }
  return null;
}

// ── TransformPass: arrow functions → function expressions ─────────────────

export const arrowToFunctionExpression: TransformPass =
  function arrowToFunctionExpression(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
  ): void {
    root.find(j.ArrowFunctionExpression).forEach(function (path) {
      const inferredName = inferNameFromParent(path, j);
      const replacement = arrowToFunction(path, j, inferredName);
      path.replace(replacement);
    });
  };

// ── TransformPass: default parameters → explicit undefined check ──────────

export const transformDefaultParams: TransformPass =
  function transformDefaultParams(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
  ): void {
    root.find(j.Function).forEach(function (path) {
      const node = path.node;
      if (!j.BlockStatement.check(node.body)) return;

      const checks: StatementKind[] = [];
      const newParams: PatternKind[] = [];

      for (const param of node.params) {
        if (j.AssignmentPattern.check(param)) {
          const left = param.left;
          const right = param.right;
          if (!j.Identifier.check(left)) {
            // Complex destructuring default — leave as-is
            newParams.push(param);
            continue;
          }
          // Strip the default from the param
          newParams.push(left);
          // Build: if (name === undefined) { name = default; }
          const check = j.ifStatement(
            j.binaryExpression(
              "===",
              j.identifier(left.name),
              j.identifier("undefined"),
            ),
            j.blockStatement([
              j.expressionStatement(
                j.assignmentExpression("=", j.identifier(left.name), right),
              ),
            ]),
          );
          checks.push(check);
        } else {
          newParams.push(param);
        }
      }

      if (checks.length === 0) return;

      node.params = newParams;
      node.body = j.blockStatement([...checks, ...(node.body.body as StatementKind[])]);
    });
  };

// ── ViolationPass: default parameters → flag only ─────────────────────────

const DEFAULT_PARAM_MESSAGE =
  "Default parameters are banned — use an explicit check at the top of the function body";
const CANONICAL_CATEGORY = "canonical" as const;

export const detectDefaultParams: ViolationPass =
  function detectDefaultParams(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root
      .find(j.Function)
      .forEach(function (path) {
        for (const param of path.node.params) {
          if (j.AssignmentPattern.check(param)) {
            const { line, column } = locOf(param);
            collector.add({
              line,
              column,
              message: DEFAULT_PARAM_MESSAGE,
              category: CANONICAL_CATEGORY,
            });
          }
        }
      });
  };

// ── ViolationPass: async function without await → flag only ───────────────

const ASYNC_NO_AWAIT_MESSAGE =
  "async function has no await — remove async or add await";

function functionHasAwait(
  node: jscodeshift.Function,
  j: jscodeshift.JSCodeshift,
): boolean {
  const body = node.body;
  if (!j.BlockStatement.check(body)) {
    return false;
  }
  let found = false;
  j(body)
    .find(j.AwaitExpression)
    .forEach(function () {
      found = true;
    });
  return found;
}

export const detectAsyncNoAwait: ViolationPass =
  function detectAsyncNoAwait(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root
      .find(j.Function)
      .filter(function (path) {
        return path.node.async === true;
      })
      .forEach(function (path) {
        if (!functionHasAwait(path.node, j)) {
          const { line, column } = locOf(path.node);
          collector.add({
            line,
            column,
            message: ASYNC_NO_AWAIT_MESSAGE,
            category: CANONICAL_CATEGORY,
          });
        }
      });
  };
