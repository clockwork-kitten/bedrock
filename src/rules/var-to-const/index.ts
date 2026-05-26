import type jscodeshift from "jscodeshift";
import type { ASTPath } from "jscodeshift";
import type { TransformPass } from "../../transformer/index.js";

const REASSIGNABLE_KINDS = ["var", "let"] as const;

type ScopeLike = {
  path: ASTPath;
};

function isReassigned(
  bindingName: string,
  scopePath: ASTPath,
  j: jscodeshift.JSCodeshift,
): boolean {
  const assignmentMatches = j(scopePath)
    .find(j.AssignmentExpression)
    .filter(function (path) {
      const left = path.node.left;
      return j.Identifier.check(left) && left.name === bindingName;
    });

  if (assignmentMatches.length > 0) {
    return true;
  }

  const updateMatches = j(scopePath)
    .find(j.UpdateExpression)
    .filter(function (path) {
      const argument = path.node.argument;
      return j.Identifier.check(argument) && argument.name === bindingName;
    });

  return updateMatches.length > 0;
}

function declaratorName(
  declarator: jscodeshift.VariableDeclarator,
  j: jscodeshift.JSCodeshift,
): string | null {
  if (j.Identifier.check(declarator.id)) {
    return declarator.id.name;
  }
  return null;
}

export const varToConst: TransformPass = function varToConst(
  root: jscodeshift.Collection,
  j: jscodeshift.JSCodeshift,
): void {
  root
    .find(j.VariableDeclaration)
    .filter(function (path) {
      return (REASSIGNABLE_KINDS as readonly string[]).includes(
        path.node.kind,
      );
    })
    .forEach(function (path) {
      const scope = path.scope as ScopeLike | null | undefined;
      if (scope === null || scope === undefined) {
        return;
      }

      const scopePath = scope.path;

      const anyReassigned = path.node.declarations.some(function (declarator) {
        if (!j.VariableDeclarator.check(declarator)) {
          return false;
        }
        const name = declaratorName(declarator, j);
        if (name === null) {
          return false;
        }
        return isReassigned(name, scopePath, j);
      });

      path.node.kind = anyReassigned ? "let" : "const";
    });
};
