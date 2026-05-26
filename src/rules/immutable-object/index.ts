import type jscodeshift from "jscodeshift";
import type {
  TransformPass,
  ViolationCollector,
  ViolationPass,
} from "../../transformer/index.js";

const VIOLATION_CATEGORY = "canonical" as const;

// ── ViolationPass: obj.foo = x (property assignment on MemberExpression) ──

const PROPERTY_ASSIGN_MESSAGE =
  "obj.foo = x is banned — use const newObj = { ...obj, foo: x } to derive a new object. If this is initial construction, this violation can be ignored.";

export const detectPropertyAssign: ViolationPass =
  function detectPropertyAssign(
    root: jscodeshift.Collection,
    j: jscodeshift.JSCodeshift,
    collector: ViolationCollector,
  ): void {
    root.find(j.AssignmentExpression).forEach(function (path) {
      const left = path.node.left;
      if (!j.MemberExpression.check(left)) {
        return;
      }
      // Only dot access (obj.foo), not computed (array[i]) — that's immutable-array
      if (left.computed) {
        return;
      }
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({
        line,
        column,
        message: PROPERTY_ASSIGN_MESSAGE,
        category: VIOLATION_CATEGORY,
      });
    });
  };

// ── ViolationPass: delete obj.foo ─────────────────────────────────────────

const DELETE_PROP_MESSAGE =
  "delete obj.foo is banned — use const { foo, ...rest } = obj to derive a new object without the property";

export const detectDeleteProp: ViolationPass = function detectDeleteProp(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.UnaryExpression, { operator: "delete" }).forEach(function (path) {
    const argument = path.node.argument;
    if (!j.MemberExpression.check(argument)) {
      return;
    }
    // Only flag dot access (delete obj.foo), not computed (delete arr[i])
    if (argument.computed) {
      return;
    }
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({
      line,
      column,
      message: DELETE_PROP_MESSAGE,
      category: VIOLATION_CATEGORY,
    });
  });
};

// ── TransformPass: obj.hasOwnProperty(key) → Object.hasOwn(obj, key) ──────

const HAS_OWN_PROPERTY_METHOD = "hasOwnProperty";

export const transformHasOwnProperty: TransformPass =
  function transformHasOwnProperty(
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
        if (
          !j.Identifier.check(property) ||
          property.name !== HAS_OWN_PROPERTY_METHOD
        ) {
          return;
        }
        const obj = callee.object;
        const args = path.node.arguments;
        // Object.hasOwn(obj, key)
        const newCallee = j.memberExpression(
          j.identifier("Object"),
          j.identifier("hasOwn"),
        );
        path.node.callee = newCallee;
        path.node.arguments = [obj, ...args];
      });
  };
