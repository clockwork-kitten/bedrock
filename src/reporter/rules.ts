import type { ViolationPass } from "../transformer/index.js";
import { detectPromiseChains } from "../rules/async-await/index.js";
import {
  detectDoWhile,
  detectForEach,
  detectBreak,
  detectContinue,
} from "../rules/loops/index.js";
import {
  detectDefaultParams,
  detectAsyncNoAwait,
} from "../rules/no-arrow-functions/index.js";
import {
  detectTernary,
  detectSwitch,
  detectLogicalOrDefault,
  detectLogicalAndExec,
  detectNullishCoalescing,
  detectOptionalChain,
} from "../rules/no-shortcircuit-control/index.js";
import {
  detectClassDeclaration,
  detectClassExpression,
  detectThisExpression,
} from "../rules/no-classes/index.js";
import {
  detectSortNoComparator,
  detectPop,
  detectShift,
  detectSplice,
  detectIndexedAssign,
  detectArrayConstructor,
} from "../rules/immutable-array/index.js";
import {
  detectPropertyAssign,
  detectDeleteProp,
} from "../rules/immutable-object/index.js";
import {
  detectAnyType,
  detectTypeAssertion,
  detectNonNullAssertion,
  detectBareCatch,
  detectEnum,
  detectInterface,
  detectNamespace,
  detectMissingReturnType,
} from "../rules/typescript-strict/index.js";
import {
  detectBannedPromiseMethods,
  detectNewPromise,
  detectBareAwait,
} from "../rules/promise-rules/index.js";

export type RegisteredViolationPass = {
  ruleName: string;
  pass: ViolationPass;
};

export const violationPasses: RegisteredViolationPass[] = [
  { ruleName: "async-await", pass: detectPromiseChains },
  { ruleName: "loops", pass: detectDoWhile },
  { ruleName: "loops", pass: detectForEach },
  { ruleName: "loops", pass: detectBreak },
  { ruleName: "loops", pass: detectContinue },
  { ruleName: "no-arrow-functions", pass: detectDefaultParams },
  { ruleName: "no-arrow-functions", pass: detectAsyncNoAwait },
  { ruleName: "no-shortcircuit-control", pass: detectTernary },
  { ruleName: "no-shortcircuit-control", pass: detectSwitch },
  { ruleName: "no-shortcircuit-control", pass: detectLogicalOrDefault },
  { ruleName: "no-shortcircuit-control", pass: detectLogicalAndExec },
  { ruleName: "no-shortcircuit-control", pass: detectNullishCoalescing },
  { ruleName: "no-shortcircuit-control", pass: detectOptionalChain },
  { ruleName: "no-classes", pass: detectClassDeclaration },
  { ruleName: "no-classes", pass: detectClassExpression },
  { ruleName: "no-classes", pass: detectThisExpression },
  { ruleName: "immutable-array", pass: detectSortNoComparator },
  { ruleName: "immutable-array", pass: detectPop },
  { ruleName: "immutable-array", pass: detectShift },
  { ruleName: "immutable-array", pass: detectSplice },
  { ruleName: "immutable-array", pass: detectIndexedAssign },
  { ruleName: "immutable-array", pass: detectArrayConstructor },
  { ruleName: "immutable-object", pass: detectPropertyAssign },
  { ruleName: "immutable-object", pass: detectDeleteProp },
  { ruleName: "typescript-strict", pass: detectAnyType },
  { ruleName: "typescript-strict", pass: detectTypeAssertion },
  { ruleName: "typescript-strict", pass: detectNonNullAssertion },
  { ruleName: "typescript-strict", pass: detectBareCatch },
  { ruleName: "typescript-strict", pass: detectEnum },
  { ruleName: "typescript-strict", pass: detectInterface },
  { ruleName: "typescript-strict", pass: detectNamespace },
  { ruleName: "typescript-strict", pass: detectMissingReturnType },
  { ruleName: "promise-rules", pass: detectBannedPromiseMethods },
  { ruleName: "promise-rules", pass: detectNewPromise },
  { ruleName: "promise-rules", pass: detectBareAwait },
];
