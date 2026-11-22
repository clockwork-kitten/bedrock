import type { ConsumerEvidence, DownstreamSlice, RuleDisposition } from "./types.js";

const AUTHORITY_ISSUE = "clockwork-kitten/studio-board#91";
const PENDING_96 = "pending clockwork-kitten/studio-board#96";

type CandidateRule = {
  legacyRuleId: string;
  targetConcept: string;
  rationale: string;
};

const CANDIDATE_RULES: CandidateRule[] = [
  { legacyRuleId: "var-to-const", targetConcept: "prefer const declarations", rationale: PENDING_96 },
  { legacyRuleId: "no-var", targetConcept: "disallow var declarations", rationale: PENDING_96 },
  { legacyRuleId: "equality", targetConcept: "require strict equality", rationale: PENDING_96 },
  { legacyRuleId: "no-any", targetConcept: "disallow explicit any", rationale: PENDING_96 },
  {
    legacyRuleId: "no-non-null-assertion",
    targetConcept: "disallow non-null assertions",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-bare-catch",
    targetConcept: "use unknown for catch variables",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-namespace",
    targetConcept: "disallow TypeScript namespaces",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "require-return-type",
    targetConcept: "require explicit function return types",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-sparse-arrays",
    targetConcept: "disallow sparse arrays",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-array-constructor",
    targetConcept: "disallow Array constructors",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-has-own-property",
    targetConcept: "prefer Object.hasOwn",
    rationale: PENDING_96,
  },
  {
    legacyRuleId: "no-mutating-sort",
    targetConcept: "prefer non-mutating array sorting",
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

const REVISIONS = {
  "clockwork-kitten/bedrock": "f3f93c9f52be3738005a5c018acf031e4e456b7d",
  "clockwork-kitten/canon": "7162ec763a9e99fbe4ef047e6ffb7fcfb5a8e18c",
  "clockwork-kitten/incubator": "b10e487fc4b8f16e8227f022ab380efd3c6401ed",
  "clockwork-kitten/ops": "7be4f6d33edd65e88d01e60d28c29bb7ee0e7285",
  "clockwork-kitten/standards": "50f290ddce8984ace6f9c7a5e161242f9ee4b0e5",
} as const;

const BEDROCK_QUERY_RESULTS = [
  ["clockwork-kitten/standards", "README.md", "reference-only"],
  ["clockwork-kitten/standards", "ROADMAP.md", "reference-only"],
  ["clockwork-kitten/standards", "llms.txt", "reference-only"],
  ["clockwork-kitten/standards", "docs/STANDARDS-ARCHITECTURE.md", "reference-only"],
  ["clockwork-kitten/standards", "packages/conform/README.md", "reference-only"],
  ["clockwork-kitten/standards", "packages/conform/configs/eslint.base.js", "functional-consumer"],
  ["clockwork-kitten/standards", "packages/conform/src/index.ts", "reference-only"],
  ["clockwork-kitten/standards", "packages/conform/src/code/run.ts", "functional-consumer"],
  ["clockwork-kitten/standards", "packages/conform/src/code/run.test.ts", "regression-evidence"],
  ["clockwork-kitten/standards", "packages/conform/src/config/resolve.ts", "functional-consumer"],
  ["clockwork-kitten/standards", "packages/conform/src/config/resolve.test.ts", "regression-evidence"],
  ["clockwork-kitten/standards", "packages/conform/src/config/types.ts", "functional-consumer"],
  ["clockwork-kitten/canon", "README.md", "reference-only"],
  ["clockwork-kitten/incubator", "docs/game-stack-decision.md", "reference-only"],
  ["clockwork-kitten/ops", "docs/DECISIONS.md", "reference-only"],
  ["clockwork-kitten/ops", "docs/OPS-ROADMAP.md", "reference-only"],
  ["clockwork-kitten/ops", "docs/identity.md", "reference-only"],
  ["clockwork-kitten/ops", "docs/oss-policy.md", "reference-only"],
] as const;

function consumerDisposition(repository: string): string {
  return repository === "clockwork-kitten/standards"
    ? "migrate all functional and documentary references via studio-board#131"
    : "reference-only; no cutover issue required";
}

export const CONSUMER_SNAPSHOT: ConsumerEvidence = {
  observedAt: "2026-11-22",
  boundedUniverse:
    "Default branches of all 21 clockwork-kitten organization repositories discoverable by authenticated GitHub code search, excluding the Bedrock source repository from consumer results, plus npm public registry lookups.",
  organizationCounts: {
    repositories: 21,
    private: 15,
    public: 6,
  },
  queries: [
    {
      id: "bedrock",
      command:
        "gh search code 'bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    },
    {
      id: "eslint-config-bedrock",
      command:
        "gh search code 'eslint-config-bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    },
    {
      id: "code.bedrock",
      command:
        "gh search code 'code.bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    },
    {
      id: "bedrock --report",
      command:
        "gh search code '\"bedrock --report\" -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    },
    {
      id: "bedrock --fix",
      command:
        "gh search code '\"bedrock --fix\" -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url",
    },
  ],
  repositoryRevisions: REVISIONS,
  results: [
    ...BEDROCK_QUERY_RESULTS.map(function ([repository, path, classification]) {
      return {
        queryId: "bedrock",
        repository,
        revision: REVISIONS[repository],
        path,
        classification,
        disposition: consumerDisposition(repository),
      };
    }),
    ...[
      ["code.bedrock", "README.md", "reference-only"],
      ["code.bedrock", "ROADMAP.md", "reference-only"],
      ["code.bedrock", "packages/conform/src/config/resolve.ts", "functional-consumer"],
      ["bedrock --report", "ROADMAP.md", "reference-only"],
      ["bedrock --report", "packages/conform/configs/eslint.base.js", "reference-only"],
      ["bedrock --fix", "ROADMAP.md", "reference-only"],
      ["bedrock --fix", "packages/conform/configs/eslint.base.js", "reference-only"],
    ].map(function ([queryId, path, classification]) {
      return {
        queryId,
        repository: "clockwork-kitten/standards",
        revision: REVISIONS["clockwork-kitten/standards"],
        path,
        classification: classification as
          | "functional-consumer"
          | "reference-only"
          | "regression-evidence",
        disposition: consumerDisposition("clockwork-kitten/standards"),
      };
    }),
  ],
  npmQueries: [
    {
      command: "npm view bedrock name version repository dist-tags --json",
      result: {
        name: "bedrock",
        version: "4.5.1",
        repository: {
          type: "git",
          url: "git+https://github.com/digitalbazaar/bedrock.git",
        },
        "dist-tags": { latest: "4.5.1" },
        classification: "unrelated third-party package",
      },
    },
    {
      command: "npm view eslint-config-bedrock name version repository dist-tags --json",
      result: {
        error: "E404",
        classification: "package not found in public registry",
      },
    },
  ],
  limitations:
    "Does not prove external/private forks, unindexed blobs, deleted branches, or local clones outside bounded search.",
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
      targetConcept: candidate.targetConcept,
      proposedOwner: "crucible",
      proposedCruxId: null,
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
    targetConcept: null,
    proposedOwner: null,
    proposedCruxId: null,
    authorityIssue: AUTHORITY_ISSUE,
  };
}
