import type jscodeshift from "jscodeshift";
import type { ViolationCollector, ViolationPass } from "../../transformer/index.js";

type NodeWithLoc = { loc?: { start: { line: number; column: number } } | null };

const TYPE_LEVEL_CATEGORY = "type-level" as const;

const ANY_TYPE_MESSAGE =
  "any is banned — use unknown with explicit narrowing";
const TYPE_ASSERTION_MESSAGE =
  "type assertion (as) is banned without a preceding type guard — narrow with an if check first";
const NON_NULL_ASSERTION_MESSAGE =
  "non-null assertion (!) is banned — use an explicit null check";
const BARE_CATCH_MESSAGE =
  "bare catch (e) is banned — use catch (e: unknown)";
const ENUM_MESSAGE =
  "enum is banned — use an as const object with a derived type";
const INTERFACE_MESSAGE =
  "interface is banned — use type";
const NAMESPACE_MESSAGE =
  "namespace/module keyword is banned — use ES module import/export";
const MISSING_RETURN_TYPE_MESSAGE =
  "exported function is missing an explicit return type annotation";

function locOf(node: NodeWithLoc): { line: number; column: number } {
  const loc = node.loc;
  const line = loc !== null && loc !== undefined ? loc.start.line : 0;
  const column = loc !== null && loc !== undefined ? loc.start.column : 0;
  return { line, column };
}

export const detectAnyType: ViolationPass = function detectAnyType(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSAnyKeyword).forEach(function (path) {
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: ANY_TYPE_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectTypeAssertion: ViolationPass = function detectTypeAssertion(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSAsExpression).forEach(function (path) {
    // `as const` is a TypeScript literal narrowing assertion, not a dangerous cast — permit it
    const typeAnnotation = path.node.typeAnnotation;
    if (j.TSTypeReference.check(typeAnnotation) && j.Identifier.check(typeAnnotation.typeName) && typeAnnotation.typeName.name === "const") {
      return;
    }
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: TYPE_ASSERTION_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectNonNullAssertion: ViolationPass = function detectNonNullAssertion(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSNonNullExpression).forEach(function (path) {
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: NON_NULL_ASSERTION_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectBareCatch: ViolationPass = function detectBareCatch(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.CatchClause).forEach(function (path) {
    const param = path.node.param;
    if (param === null || param === undefined) {
      return;
    }
    if (param.type !== "Identifier") {
      return;
    }
    const identifier = param as jscodeshift.Identifier;
    const hasTypeAnnotation =
      identifier.typeAnnotation !== null && identifier.typeAnnotation !== undefined;
    if (hasTypeAnnotation) {
      return;
    }
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: BARE_CATCH_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectEnum: ViolationPass = function detectEnum(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSEnumDeclaration).forEach(function (path) {
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: ENUM_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectInterface: ViolationPass = function detectInterface(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSInterfaceDeclaration).forEach(function (path) {
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: INTERFACE_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectNamespace: ViolationPass = function detectNamespace(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.TSModuleDeclaration).forEach(function (path) {
    const { line, column } = locOf(path.node);
    collector.add({ line, column, message: NAMESPACE_MESSAGE, category: TYPE_LEVEL_CATEGORY });
  });
};

export const detectMissingReturnType: ViolationPass = function detectMissingReturnType(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
  collector: ViolationCollector,
): void {
  root.find(j.ExportNamedDeclaration).forEach(function (path) {
    const declaration = path.node.declaration;
    if (declaration === null || declaration === undefined) {
      return;
    }
    if (declaration.type !== "FunctionDeclaration") {
      return;
    }
    const funcDecl = declaration as jscodeshift.FunctionDeclaration;
    const hasReturnType =
      funcDecl.returnType !== null && funcDecl.returnType !== undefined;
    if (hasReturnType) {
      return;
    }
    const { line, column } = locOf(funcDecl);
    collector.add({
      line,
      column,
      message: MISSING_RETURN_TYPE_MESSAGE,
      category: TYPE_LEVEL_CATEGORY,
    });
  });
};
