import type jscodeshift from "jscodeshift";

export function printSource(root: jscodeshift.Collection): string {
  return root.toSource();
}
