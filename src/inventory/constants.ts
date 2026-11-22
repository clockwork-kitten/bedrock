import type { DownstreamSlice, RuleDisposition } from "./types.js";

const AUTHORITY_ISSUE = "clockwork-kitten/studio-board#91";
const PENDING_96 = "pending clockwork-kitten/studio-board#96";

type CandidateRule = {
  legacyRuleId: string;
  proposedCruxId: string;
  rationale: string;
};

const CANDIDATE_RULES: CandidateRule[] = [
  { legacyRuleId: "var-to-const", proposedCruxId: "crux/code/prefer-const", rationale: PENDING_96 },
  { legacyRuleId: "no-var", proposedCruxId: "crux/code/no-var", rationale: PENDING_96 },
  { legacyRuleId: "equality", proposedCruxId: "crux/code/strict-equality", rationale: PENDING_96 },
  { legacyRuleId: "no-any", proposedCruxId: "crux/typing/no-explicit-any", rationale: PENDING_96 },
  {
    legacyRuleId: "no-non-null-assertion",
    proposedCruxId: "crux/typing/no-non-null-assertion",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-bare-catch",
    proposedCruxId: "crux/typing/use-unknown-in-catch-callback-variable",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-namespace",
    proposedCruxId: "crux/typing/no-namespace",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "require-return-type",
    proposedCruxId: "crux/typing/explicit-function-return-type",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-sparse-arrays",
    proposedCruxId: "crux/code/no-sparse-arrays",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-array-constructor",
    proposedCruxId: "crux/code/no-array-constructor",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-has-own-property",
    proposedCruxId: "crux/code/prefer-object-has-own",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-mutating-sort",
    proposedCruxId: "crux/code/prefer-to-sorted",
    rationale: PENDING_96,
  },
];

const DROP_RATIONALES = {
  syntaxNormalization:
    "Dropped: maximalist syntax normalization conflicts with modern JS/TS defaults and current Standards.",
  mutationRewrite:
    "Dropped: mutation rewrite behavior is context-sensitive and can be semantics-changing or unsafe.",
  asyncTypeBreadth:
    "Dropped: policy is overbroad/context-sensitive and not retained in MVP ownership transfer.",
} as const;

const DROPPED_RULES: Record<string, string> = {
  "no-arrow-functions": DROP_RATIONALES.syntaxNormalization,
  "no-default-parameters": DROP_RATIONALES.syntaxNormalization,
  "no-for-each": DROP_RATIONALES.syntaxNormalization,
  "no-for-of": DROP_RATIONALES.syntaxNormalization,
  "no-for-in": DROP_RATIONALES.syntaxNormalization,
  "no-while": DROP_RATIONALES.syntaxNormalization,
  "no-do-while": DROP_RATIONALES.syntaxNormalization,
  "no-labeled-statements": DROP_RATIONALES.syntaxNormalization,
  "no-break": DROP_RATIONALES.syntaxNormalization,
  "no-continue": DROP_RATIONALES.syntaxNormalization,
  "no-ternary": DROP_RATIONALES.syntaxNormalization,
  "no-switch": DROP_RATIONALES.syntaxNormalization,
  "no-logical-or-default": DROP_RATIONALES.syntaxNormalization,
  "no-logical-and-execution": DROP_RATIONALES.syntaxNormalization,
  "no-nullish-coalescing": DROP_RATIONALES.syntaxNormalization,
  "no-optional-chaining": DROP_RATIONALES.syntaxNormalization,
  "no-increment": DROP_RATIONALES.syntaxNormalization,
  "no-shorthand-operators": DROP_RATIONALES.syntaxNormalization,
  "no-classes": DROP_RATIONALES.syntaxNormalization,
  "no-this": DROP_RATIONALES.syntaxNormalization,
  "no-template-literals": DROP_RATIONALES.syntaxNormalization,
  "no-interface": DROP_RATIONALES.syntaxNormalization,
  "no-enum": DROP_RATIONALES.syntaxNormalization,
  "no-general-destructuring": DROP_RATIONALES.syntaxNormalization,
  "no-spread-args": DROP_RATIONALES.syntaxNormalization,
  "no-array-push": DROP_RATIONALES.mutationRewrite,
  "no-array-unshift": DROP_RATIONALES.mutationRewrite,
  "no-array-pop": DROP_RATIONALES.mutationRewrite,
  "no-array-shift": DROP_RATIONALES.mutationRewrite,
  "no-array-splice": DROP_RATIONALES.mutationRewrite,
  "no-array-index-assign": DROP_RATIONALES.mutationRewrite,
  "no-property-assign": DROP_RATIONALES.mutationRewrite,
  "no-delete": DROP_RATIONALES.mutationRewrite,
  "no-async-without-await": DROP_RATIONALES.asyncTypeBreadth,
  "no-promise-then": DROP_RATIONALES.asyncTypeBreadth,
  "no-type-assertion": DROP_RATIONALES.asyncTypeBreadth,
  "no-sort-without-comparator": DROP_RATIONALES.asyncTypeBreadth,
  "no-promise-race": DROP_RATIONALES.asyncTypeBreadth,
  "no-promise-any": DROP_RATIONALES.asyncTypeBreadth,
  "no-new-promise": DROP_RATIONALES.asyncTypeBreadth,
  "no-unhandled-rejection": DROP_RATIONALES.asyncTypeBreadth,
};

export const REPORTER_IDS = [
  "async-await",
  "immutable-array",
  "immutable-object",
  "loops",
  "no-arrow-functions",
  "no-classes",
  "no-shortcircuit-control",
  "promise-rules",
  "typescript-strict",
] as const;

export const FIXER_TO_RULE_IDS: Record<string, string[]> = {
  varToConst: ["var-to-const", "no-var"],
  equalityToStrict: ["equality"],
  forOfToIndexed: ["no-for-of"],
  forInToIndexed: ["no-for-in"],
  whileToFor: ["no-while"],
  transformForEach: ["no-for-each"],
  transformPush: ["no-array-push"],
  transformUnshift: ["no-array-unshift"],
  transformSort: ["no-mutating-sort", "no-sort-without-comparator"],
  transformSparseArrays: ["no-sparse-arrays"],
  transformHasOwnProperty: ["no-has-own-property"],
  arrowToFunctionExpression: ["no-arrow-functions"],
  transformDefaultParams: ["no-default-parameters"],
  compoundAssignToExplicit: ["no-shorthand-operators"],
  updateExpressionToExplicit: ["no-increment"],
  rewriteTemplateLiterals: ["no-template-literals"],
};

export const DETECTOR_TO_RULE_IDS: Record<string, string[]> = {
  detectPromiseChains: ["no-promise-then"],
  detectDoWhile: ["no-do-while"],
  detectForEach: ["no-for-each"],
  detectBreak: ["no-break"],
  detectContinue: ["no-continue"],
  detectDefaultParams: ["no-default-parameters"],
  detectAsyncNoAwait: ["no-async-without-await"],
  detectTernary: ["no-ternary"],
  detectSwitch: ["no-switch"],
  detectLogicalOrDefault: ["no-logical-or-default"],
  detectLogicalAndExec: ["no-logical-and-execution"],
  detectNullishCoalescing: ["no-nullish-coalescing"],
  detectOptionalChain: ["no-optional-chaining"],
  detectClassDeclaration: ["no-classes"],
  detectClassExpression: ["no-classes"],
  detectThisExpression: ["no-this"],
  detectSortNoComparator: ["no-sort-without-comparator"],
  detectPop: ["no-array-pop"],
  detectShift: ["no-array-shift"],
  detectSplice: ["no-array-splice"],
  detectIndexedAssign: ["no-array-index-assign"],
  detectArrayConstructor: ["no-array-constructor"],
  detectPropertyAssign: ["no-property-assign"],
  detectDeleteProp: ["no-delete"],
  detectAnyType: ["no-any"],
  detectTypeAssertion: ["no-type-assertion"],
  detectNonNullAssertion: ["no-non-null-assertion"],
  detectBareCatch: ["no-bare-catch"],
  detectEnum: ["no-enum"],
  detectInterface: ["no-interface"],
  detectNamespace: ["no-namespace"],
  detectMissingReturnType: ["require-return-type"],
  detectBannedPromiseMethods: ["no-promise-race", "no-promise-any"],
  detectNewPromise: ["no-new-promise"],
  detectBareAwait: ["no-unhandled-rejection"],
  detectUpdateExpressionInExpression: ["no-increment"],
  detectTaggedTemplateLiterals: ["no-template-literals"],
};

export const SURFACE_ROWS = [
  {
    id: "reporter-contract",
    kind: "reporter-contract",
    disposition: "dropped" as const,
    rationale:
      "Dropped: Bedrock text rendering and grounded semantics are replaced by canonical Crux/Crucible/Conform output contracts (#134).",
  },
  {
    id: "cli-contract",
    kind: "cli-contract",
    disposition: "dropped" as const,
    rationale:
      "Dropped: bedrock CLI flags/globs/output are retired; no command alias or compatibility mode is introduced (#86/#87).",
  },
  {
    id: "config-packages",
    kind: "config-contract",
    disposition: "dropped" as const,
    rationale:
      "Dropped: eslint-config-bedrock identity and generated config are retired in favor of Crucible-owned bundles (#134).",
  },
  {
    id: "workflow-release",
    kind: "workflow",
    disposition: "dropped" as const,
    rationale:
      "Dropped: Bedrock-specific release/publish workflow ownership ends during retirement cutover (#135).",
  },
  {
    id: "suppression-surface:none",
    kind: "suppression",
    disposition: "none" as const,
    rationale:
      "Verified: no Bedrock suppression mechanism exists; no suppression alias or compatibility behavior is required.",
  },
] as const;

export const DOWNSTREAM_SLICES: DownstreamSlice[] = [
  {
    id: "studio-board#91",
    repository: "clockwork-kitten/bedrock",
    size: "M",
    status: "implemented-here",
    notes: "Commit disposition ledgers + inventory validation and generation.",
  },
  {
    id: "studio-board#96",
    repository: "clockwork-kitten/crux",
    size: "L",
    status: "existing",
    notes: "Assign permanent Crux IDs and owners. #91 must not invent final IDs.",
  },
  {
    id: "studio-board#131",
    repository: "clockwork-kitten/standards",
    size: "M",
    status: "existing",
    notes: "Remove the only functional Bedrock consumer wiring.",
  },
  {
    id: "studio-board#133",
    repository: "clockwork-kitten/crucible",
    size: "L",
    status: "existing",
    notes: "Reimplement approved analyzer/fixer behavior under Crucible ownership.",
  },
  {
    id: "studio-board#134",
    repository: "clockwork-kitten/crucible",
    size: "M",
    status: "existing",
    notes: "Migrate Bedrock reporting/config behavior to canonical contracts.",
  },
  {
    id: "studio-board#135",
    repository: "clockwork-kitten/bedrock",
    size: "S",
    status: "existing",
    notes: "Final retirement/archive after downstream cutover completes.",
  },
];

export const CONSUMER_SNAPSHOT = {
  observedAt: "2026-11-22",
  boundedUniverse:
    "clockwork-kitten org repositories discoverable via authenticated GitHub code search plus npm public registry lookups",
  organizationCounts: {
    repositories: 21,
    private: 15,
    public: 6,
  },
  repositories: [
    {
      repository: "clockwork-kitten/standards",
      classification: "functional-consumer",
      disposition: "migrate via studio-board#131",
      evidence:
        "packages/conform/src/code/run.ts wires bedrock command and --fix/--report args; config exposes code.bedrock",
    },
    {
      repository: "clockwork-kitten/canon",
      classification: "reference-only",
      disposition: "no cutover issue required",
      evidence: "README mention only; no invocation/import/dependency",
    },
    {
      repository: "clockwork-kitten/incubator",
      classification: "reference-only",
      disposition: "no cutover issue required",
      evidence: "docs mention only; no invocation/import/dependency",
    },
    {
      repository: "clockwork-kitten/ops",
      classification: "reference-only",
      disposition: "no cutover issue required",
      evidence: "markdown mentions only; no invocation/import/dependency",
    },
  ],
  npm: {
    bedrock: "unrelated third-party package",
    eslintConfigBedrock: "404 not found",
  },
  limitations:
    "Does not prove external/private forks, unindexed blobs, deleted branches, or local clones outside bounded search.",
  reproductionCommands: [
    "gh api --method GET orgs/clockwork-kitten/repos -f per_page=100 --paginate",
    "gh search code 'bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    "gh search code 'eslint-config-bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    "gh search code 'code.bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    "npm view bedrock name version repository dist-tags --json",
    "npm view eslint-config-bedrock name version repository dist-tags --json",
  ],
};

export function resolveRuleDisposition(ruleId: string): RuleDisposition {
  const candidate = CANDIDATE_RULES.find(function (entry) {
    return entry.legacyRuleId === ruleId;
  });

  if (candidate !== undefined) {
    return {
      legacyRuleId: ruleId,
      disposition: "candidate-pending-96",
      rationale: candidate.rationale,
      proposedOwner: "crucible",
      proposedCruxId: candidate.proposedCruxId + " (" + PENDING_96 + ")",
      authorityIssue: AUTHORITY_ISSUE,
    };
  }

  const rationale = DROPPED_RULES[ruleId];
  if (rationale === undefined) {
    throw new Error("Missing rule disposition mapping for: " + ruleId);
  }

  return {
    legacyRuleId: ruleId,
    disposition: "dropped",
    rationale,
    proposedOwner: null,
    proposedCruxId: null,
    authorityIssue: AUTHORITY_ISSUE,
  };
}

