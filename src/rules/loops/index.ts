import type jscodeshift from "jscodeshift";
import type { StatementKind } from "ast-types/lib/gen/kinds.js";
import type {
  TransformPass,
  ViolationCollector,
  ViolationPass,
} from "../../transformer/index.js";

// ── TransformPass: for...of → indexed for loop ────────────────────────────

const INDEX_VAR = "i";

export const forOfToIndexed: TransformPass = function forOfToIndexed(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root.find(j.ForOfStatement).forEach(function (path) {
    const left = path.node.left;
    const right = path.node.right;
    const body = path.node.body;

    // Extract the element binding — simple identifier or destructuring pattern
    let elementBinding: jscodeshift.Identifier | jscodeshift.ObjectPattern | jscodeshift.ArrayPattern | null = null;
    if (
      j.VariableDeclaration.check(left) &&
      left.declarations.length === 1 &&
      j.VariableDeclarator.check(left.declarations[0])
    ) {
      const id = left.declarations[0].id;
      if (j.Identifier.check(id) || j.ObjectPattern.check(id) || j.ArrayPattern.check(id)) {
        elementBinding = id;
      }
    }

    // Build `let i = 0; i < array.length; i = i + 1`
    const init = j.variableDeclaration("let", [
      j.variableDeclarator(j.identifier(INDEX_VAR), j.literal(0)),
    ]);
    const test = j.binaryExpression(
      "<",
      j.identifier(INDEX_VAR),
      j.memberExpression(right, j.identifier("length")),
    );
    const update = j.assignmentExpression(
      "=",
      j.identifier(INDEX_VAR),
      j.binaryExpression("+", j.identifier(INDEX_VAR), j.literal(1)),
    );

    // Build the body: prepend `const <binding> = array[i];` if we have a binding
    let newBody: StatementKind;
    if (elementBinding !== null && j.BlockStatement.check(body)) {
      const elementDecl = j.variableDeclaration("const", [
        j.variableDeclarator(
          elementBinding,
          j.memberExpression(right, j.identifier(INDEX_VAR), true),
        ),
      ]);
      newBody = j.blockStatement([elementDecl, ...body.body]);
    } else if (elementBinding !== null) {
      const elementDecl = j.variableDeclaration("const", [
        j.variableDeclarator(
          elementBinding,
          j.memberExpression(right, j.identifier(INDEX_VAR), true),
        ),
      ]);
      newBody = j.blockStatement([elementDecl, body]);
    } else {
      newBody = body;
    }

    const forStatement = j.forStatement(init, test, update, newBody);
    path.replace(forStatement);
  });
};

// ── TransformPass: for...in → Object.keys + indexed for loop ─────────────

const KEYS_VAR = "keys";

export const forInToIndexed: TransformPass = function forInToIndexed(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root.find(j.ForInStatement).forEach(function (path) {
    const left = path.node.left;
    const right = path.node.right;
    const body = path.node.body;

    // Extract the key variable name from `const key` or `let key`
    let keyName: string | null = null;
    if (
      j.VariableDeclaration.check(left) &&
      left.declarations.length === 1 &&
      j.VariableDeclarator.check(left.declarations[0]) &&
      j.Identifier.check(left.declarations[0].id)
    ) {
      keyName = left.declarations[0].id.name;
    } else if (j.Identifier.check(left)) {
      keyName = left.name;
    }

    // `const keys = Object.keys(obj);`
    const keysDecl = j.variableDeclaration("const", [
      j.variableDeclarator(
        j.identifier(KEYS_VAR),
        j.callExpression(
          j.memberExpression(j.identifier("Object"), j.identifier("keys")),
          [right],
        ),
      ),
    ]);

    // Build `let i = 0; i < keys.length; i = i + 1`
    const init = j.variableDeclaration("let", [
      j.variableDeclarator(j.identifier(INDEX_VAR), j.literal(0)),
    ]);
    const test = j.binaryExpression(
      "<",
      j.identifier(INDEX_VAR),
      j.memberExpression(j.identifier(KEYS_VAR), j.identifier("length")),
    );
    const update = j.assignmentExpression(
      "=",
      j.identifier(INDEX_VAR),
      j.binaryExpression("+", j.identifier(INDEX_VAR), j.literal(1)),
    );

    // Prepend `const key = keys[i];` to body
    let newBody: StatementKind;
    if (keyName !== null && j.BlockStatement.check(body)) {
      const keyDecl = j.variableDeclaration("const", [
        j.variableDeclarator(
          j.identifier(keyName),
          j.memberExpression(j.identifier(KEYS_VAR), j.identifier(INDEX_VAR), true),
        ),
      ]);
      newBody = j.blockStatement([keyDecl, ...body.body]);
    } else if (keyName !== null) {
      const keyDecl = j.variableDeclaration("const", [
        j.variableDeclarator(
          j.identifier(keyName),
          j.memberExpression(j.identifier(KEYS_VAR), j.identifier(INDEX_VAR), true),
        ),
      ]);
      newBody = j.blockStatement([keyDecl, j.blockStatement([body])]);
    } else {
      newBody = body;
    }

    const forStatement = j.forStatement(init, test, update, newBody);

    // Replace the for-in with: keysDecl + forStatement
    // We need to insert the keysDecl before the for loop
    const parent = path.parent;
    if (
      j.BlockStatement.check(parent.node) ||
      j.Program.check(parent.node)
    ) {
      const idx = (parent.node.body as jscodeshift.Statement[]).indexOf(path.node);
      (parent.node.body as jscodeshift.Statement[]).splice(idx, 1, keysDecl, forStatement);
    } else {
      // Wrap in block if not inside a block or program
      path.replace(j.blockStatement([keysDecl, forStatement]));
    }
  });
};

// ── TransformPass: while → for (; cond;) ─────────────────────────────────

export const whileToFor: TransformPass = function whileToFor(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root.find(j.WhileStatement).forEach(function (path) {
    const forStatement = j.forStatement(null, path.node.test, null, path.node.body);
    path.replace(forStatement);
  });
};

// ── ViolationPass: do...while → flag only ────────────────────────────────

const DO_WHILE_MESSAGE =
  "do...while is banned — rewrite as a for loop with the condition at the top";
const VIOLATION_CATEGORY = "canonical" as const;

export const detectDoWhile: ViolationPass = function detectDoWhile(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.DoWhileStatement).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: DO_WHILE_MESSAGE, category: VIOLATION_CATEGORY });
  });
};

// ── TransformPass: forEach → indexed for loop ────────────────────────────

const FOREACH_METHOD_NAME = "forEach";
const ITEM_INDEX_VAR = "i";

export const transformForEach: TransformPass = function transformForEach(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root
    .find(j.ExpressionStatement, {
      expression: { type: "CallExpression" },
    })
    .forEach(function (stmtPath) {
      const expr = stmtPath.node.expression;
      if (!j.CallExpression.check(expr)) return;
      const callee = expr.callee;
      if (!j.MemberExpression.check(callee)) return;
      if (!j.Identifier.check(callee.property)) return;
      if (callee.property.name !== FOREACH_METHOD_NAME) return;

      const args = expr.arguments;
      if (args.length < 1) return;
      const callback = args[0];
      if (!j.FunctionExpression.check(callback)) return;
      if (!j.BlockStatement.check(callback.body)) return;
      const params = callback.params;
      if (params.length < 1) return;

      const itemParam = params[0];
      const indexParam = params.length >= 2 ? params[1] : null;
      if (!j.Identifier.check(itemParam)) return;
      if (indexParam !== null && !j.Identifier.check(indexParam)) return;

      const arrayNode = callee.object;
      const itemName = itemParam.name;
      const indexName = indexParam !== null && j.Identifier.check(indexParam) ? indexParam.name : null;

      const init = j.variableDeclaration("let", [
        j.variableDeclarator(j.identifier(ITEM_INDEX_VAR), j.literal(0)),
      ]);
      const test = j.binaryExpression(
        "<",
        j.identifier(ITEM_INDEX_VAR),
        j.memberExpression(arrayNode, j.identifier("length")),
      );
      const update = j.assignmentExpression(
        "=",
        j.identifier(ITEM_INDEX_VAR),
        j.binaryExpression("+", j.identifier(ITEM_INDEX_VAR), j.literal(1)),
      );

      const itemDecl = j.variableDeclaration("const", [
        j.variableDeclarator(
          j.identifier(itemName),
          j.memberExpression(arrayNode, j.identifier(ITEM_INDEX_VAR), true),
        ),
      ]);

      const preamble: StatementKind[] = [itemDecl];
      if (indexName !== null) {
        const indexDecl = j.variableDeclaration("const", [
          j.variableDeclarator(
            j.identifier(indexName),
            j.identifier(ITEM_INDEX_VAR),
          ),
        ]);
        preamble.push(indexDecl);
      }

      const newBody = j.blockStatement([...preamble, ...callback.body.body]);
      const forStatement = j.forStatement(init, test, update, newBody);
      // Replace the ExpressionStatement wrapper with the ForStatement
      stmtPath.replace(forStatement);
    });
};

// ── ViolationPass: forEach → flag only ───────────────────────────────────

const FOREACH_METHOD = "forEach";
const FOREACH_MESSAGE =
  "array.forEach() is banned — rewrite as a for (let i = 0; i < array.length; i++) loop";

export const detectForEach: ViolationPass = function detectForEach(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root
    .find(j.CallExpression, { callee: { type: "MemberExpression" } })
    .forEach(function (path) {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return;
      }
      const property = callee.property;
      if (!j.Identifier.check(property)) {
        return;
      }
      if (property.name !== FOREACH_METHOD) {
        return;
      }
      const loc = path.node.loc;
      const line = loc !== null && loc !== undefined ? loc.start.line : 0;
      const column = loc !== null && loc !== undefined ? loc.start.column : 0;
      collector.add({ line, column, message: FOREACH_MESSAGE, category: VIOLATION_CATEGORY });
    });
};

// ── ViolationPass: break → flag only ─────────────────────────────────────

const BREAK_MESSAGE =
  "break is banned — refactor into a named function with early return";

export const detectBreak: ViolationPass = function detectBreak(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.BreakStatement).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: BREAK_MESSAGE, category: VIOLATION_CATEGORY });
  });
};

// ── ViolationPass: continue → flag only ──────────────────────────────────

const CONTINUE_MESSAGE =
  "continue is banned — refactor into a named function with early return";

export const detectContinue: ViolationPass = function detectContinue(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.ContinueStatement).forEach(function (path) {
    const loc = path.node.loc;
    const line = loc !== null && loc !== undefined ? loc.start.line : 0;
    const column = loc !== null && loc !== undefined ? loc.start.column : 0;
    collector.add({ line, column, message: CONTINUE_MESSAGE, category: VIOLATION_CATEGORY });
  });
};

