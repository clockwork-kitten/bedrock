import type jscodeshift from "jscodeshift";
import type { ExpressionKind } from "ast-types/lib/gen/kinds.js";
import type {
  TransformPass,
  ViolationCollector,
  ViolationPass,
} from "../../transformer/index.js";

const VIOLATION_CATEGORY = "canonical" as const;

// ── TransformPass: push(x) → [...array, x] ───────────────────────────────

const PUSH_METHOD = "push";

export const transformPush: TransformPass = function transformPush(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root
    .find(j.ExpressionStatement, {
      expression: { type: "CallExpression" },
    })
    .forEach(function (path) {
      const expr = path.node.expression;
      if (!j.CallExpression.check(expr)) {
        return;
      }
      const callee = expr.callee;
      if (!j.MemberExpression.check(callee)) {
        return;
      }
      const property = callee.property;
      if (!j.Identifier.check(property) || property.name !== PUSH_METHOD) {
        return;
      }
      const arrayExpr = callee.object;
      if (!j.Identifier.check(arrayExpr)) {
        return;
      }
      const args = expr.arguments;
      if (args.length === 0) {
        return;
      }
      // Generate a unique name like `arrayName2`
      const newName = arrayExpr.name + "2";
      const spreadArray = j.spreadElement(j.identifier(arrayExpr.name));
      const elements: jscodeshift.ArrayExpression["elements"] = [spreadArray];
      for (const arg of args) {
        if (
          j.SpreadElement.check(arg) ||
          j.SpreadProperty.check(arg) ||
          j.RestElement.check(arg)
        ) {
          elements.push(arg);
        } else {
          elements.push(arg as ExpressionKind);
        }
      }
      const newArray = j.arrayExpression(elements);
      const decl = j.variableDeclaration("const", [
        j.variableDeclarator(j.identifier(newName), newArray),
      ]);
      path.replace(decl);
    });
};

// ── TransformPass: unshift(x) → [x, ...array] ────────────────────────────

const UNSHIFT_METHOD = "unshift";

export const transformUnshift: TransformPass = function transformUnshift(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root
    .find(j.ExpressionStatement, {
      expression: { type: "CallExpression" },
    })
    .forEach(function (path) {
      const expr = path.node.expression;
      if (!j.CallExpression.check(expr)) {
        return;
      }
      const callee = expr.callee;
      if (!j.MemberExpression.check(callee)) {
        return;
      }
      const property = callee.property;
      if (!j.Identifier.check(property) || property.name !== UNSHIFT_METHOD) {
        return;
      }
      const arrayExpr = callee.object;
      if (!j.Identifier.check(arrayExpr)) {
        return;
      }
      const args = expr.arguments;
      if (args.length === 0) {
        return;
      }
      const newName = arrayExpr.name + "2";
      const spreadArray = j.spreadElement(j.identifier(arrayExpr.name));
      const elements: jscodeshift.ArrayExpression["elements"] = [];
      for (const arg of args) {
        if (
          j.SpreadElement.check(arg) ||
          j.SpreadProperty.check(arg) ||
          j.RestElement.check(arg)
        ) {
          elements.push(arg);
        } else {
          elements.push(arg as ExpressionKind);
        }
      }
      elements.push(spreadArray);
      const newArray = j.arrayExpression(elements);
      const decl = j.variableDeclaration("const", [
        j.variableDeclarator(j.identifier(newName), newArray),
      ]);
      path.replace(decl);
    });
};

// ── TransformPass: sort(comparator) → [...array].sort(comparator) ─────────

const SORT_METHOD = "sort";

export const transformSort: TransformPass = function transformSort(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
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
      if (!j.Identifier.check(property) || property.name !== SORT_METHOD) {
        return;
      }
      // Only transform if there IS a comparator argument
      if (path.node.arguments.length === 0) {
        return;
      }
      const arrayExpr = callee.object;
      // Already spread: [...array].sort(...) — skip
      if (
        j.ArrayExpression.check(arrayExpr) &&
        arrayExpr.elements.length === 1 &&
        j.SpreadElement.check(arrayExpr.elements[0])
      ) {
        return;
      }
      const spreadCopy = j.arrayExpression([j.spreadElement(arrayExpr)]);
      const newCallee = j.memberExpression(spreadCopy, j.identifier(SORT_METHOD));
      path.node.callee = newCallee;
    });
};

// ── TransformPass: sparse arrays → replace holes with undefined ───────────

export const transformSparseArrays: TransformPass =
  function transformSparseArrays(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
  ): void {
    root.find(j.ArrayExpression).forEach(function (path) {
      const elements = path.node.elements;
      let changed = false;
      const newElements: jscodeshift.ArrayExpression["elements"] = elements.map(
        function (el) {
          if (el === null) {
            changed = true;
            return j.identifier("undefined");
          }
          return el;
        },
      );
      if (changed) {
        path.node.elements = newElements;
      }
    });
  };

// ── ViolationPass: sort() without comparator ─────────────────────────────

const SORT_NO_COMPARATOR_MESSAGE =
  "array.sort() without a comparator is banned — always provide an explicit comparator function";

export const detectSortNoComparator: ViolationPass =
  function detectSortNoComparator(
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
        if (!j.Identifier.check(property) || property.name !== SORT_METHOD) {
          return;
        }
        if (path.node.arguments.length !== 0) {
          return;
        }
        const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
        collector.add({
          line,
          column,
          message: SORT_NO_COMPARATOR_MESSAGE,
          category: VIOLATION_CATEGORY,
        });
      });
  };

// ── ViolationPass: pop() ──────────────────────────────────────────────────

const POP_METHOD = "pop";
const POP_MESSAGE =
  "array.pop() is banned — use array[array.length - 1] for the last element and array.slice(0, -1) for the rest";

export const detectPop: ViolationPass = function detectPop(
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
      if (!j.Identifier.check(property) || property.name !== POP_METHOD) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: POP_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

// ── ViolationPass: shift() ────────────────────────────────────────────────

const SHIFT_METHOD = "shift";
const SHIFT_MESSAGE =
  "array.shift() is banned — use const [first, ...rest] = array instead";

export const detectShift: ViolationPass = function detectShift(
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
      if (!j.Identifier.check(property) || property.name !== SHIFT_METHOD) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: SHIFT_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

// ── ViolationPass: splice() ───────────────────────────────────────────────

const SPLICE_METHOD = "splice";
const SPLICE_MESSAGE =
  "array.splice() is banned — use slice + spread reconstruction to derive a new array";

export const detectSplice: ViolationPass = function detectSplice(
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
      if (!j.Identifier.check(property) || property.name !== SPLICE_METHOD) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: SPLICE_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

// ── ViolationPass: indexed assignment array[i] = x ────────────────────────

const INDEXED_ASSIGN_MESSAGE =
  "array[i] = x is banned — use [...array.slice(0, i), x, ...array.slice(i + 1)] to derive a new array";

export const detectIndexedAssign: ViolationPass =
  function detectIndexedAssign(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.AssignmentExpression).forEach(function (path) {
      const left = path.node.left;
      if (!j.MemberExpression.check(left)) {
        return;
      }
      // Must be computed access (array[i]), not dot access (obj.foo)
      if (!left.computed) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: INDEXED_ASSIGN_MESSAGE,
        category: VIOLATION_CATEGORY,
      });
    });
  };

// ── ViolationPass: Array(n) constructor ──────────────────────────────────

const ARRAY_CONSTRUCTOR_MESSAGE =
  "Array(n) constructor is banned — use new Array(n).fill(value) or an explicit array literal";

function isArrayConstructorCall(
  node: jscodeshift.CallExpression | jscodeshift.NewExpression,
  j: jscodeshift.JSCodeshift,
): boolean {
  const callee = node.callee;
  return j.Identifier.check(callee) && callee.name === "Array";
}

export const detectArrayConstructor: ViolationPass =
  function detectArrayConstructor(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.NewExpression).forEach(function (path) {
      if (!isArrayConstructorCall(path.node, j)) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: ARRAY_CONSTRUCTOR_MESSAGE,
        category: VIOLATION_CATEGORY,
      });
    });

    root.find(j.CallExpression).forEach(function (path) {
      if (!isArrayConstructorCall(path.node, j)) {
        return;
      }
      const loc = path.node.loc;
        const line = loc !== null && loc !== undefined ? loc.start.line : 0;
        const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: ARRAY_CONSTRUCTOR_MESSAGE,
        category: VIOLATION_CATEGORY,
      });
    });
  };
