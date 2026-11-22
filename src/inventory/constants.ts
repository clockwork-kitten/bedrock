import type { ConsumerEvidence, DownstreamSlice, RuleDisposition } from "./types.js";

const AUTHORITY_ISSUE = "clockwork-kitten/studio-board#91";
const PENDING_96 = "pending clockwork-kitten/studio-board#96";

export const BEHAVIOR_CONTRACT_CATALOG: Record<string, string> = {
  "cli:declaration:src/cli/args.ts:FIX_FLAG":
    "77ca02f8b436047e1b67db9a0f8cfa15e93212ac4857580d0b52f6ad57557014",
  "cli:declaration:src/cli/args.ts:parseArgs":
    "1d3548fc04cda86d5ecd131d283da1bec81b80744e56177b9573fb8d81384e24",
  "cli:declaration:src/cli/args.ts:REPORT_FLAG":
    "e59f35f39f9c008cde43a336ab67bd5d8fd214f8da823456fe03598310a19196",
  "cli:declaration:src/cli/index.ts:main":
    "f06f9ecff3faaebf4617f9941084123e19d03f173cb43d67a717a4ee7c93190e",
  "cli:declaration:src/cli/runner.ts:addFileIfNew":
    "c4bbdbec2ac0bc838e7420f8f28ee52f32a0118ebb29b90b8ef5feeb6b1aa4e3",
  "cli:declaration:src/cli/runner.ts:ALL_TRANSFORM_PASSES":
    "1d08c843056388d886953acce5a76482fecb1a66e0556317cc298fef6ed21ce6",
  "cli:declaration:src/cli/runner.ts:detectParser":
    "aac390c467e78ffc3699594b91ecdaafe153a498d3d650d75390f6d68aeba27b",
  "cli:declaration:src/cli/runner.ts:findBaseIndex":
    "86e1f939a835b72d37aefa234460db86ca2778e8a8b64f12dcb827bb33a73514",
  "cli:declaration:src/cli/runner.ts:globToRegex":
    "326f9732eadafdf56b1e1703525ebe5d164f9f998679d08ce9ef21f48237ffe1",
  "cli:declaration:src/cli/runner.ts:isGlobPattern":
    "a5c1b33ac4e3c5f4d46553696f9b446acd06fd9e71bb6d594776e13d656429a3",
  "cli:declaration:src/cli/runner.ts:isSupported":
    "af2e07a2d6f8acde2c2f046cccaa23616c08a367de9dea31fba2801088ce6812",
  "cli:declaration:src/cli/runner.ts:resolveDirectPattern":
    "3f585943d907438d0d75fc65aa68e47430065c4770d50adffc73c4009d5632d6",
  "cli:declaration:src/cli/runner.ts:resolveGlobPattern":
    "94f4e2ae06cc004dca816b0ef07e63165c3684fbc42f1192bbe77b6ed8b436c0",
  "cli:declaration:src/cli/runner.ts:resolvePatterns":
    "163c3a9168114fd4fbacc6cfd388998591802b0eb190b01853f94aebfeca5272",
  "cli:declaration:src/cli/runner.ts:run":
    "311d7a8d87ea82257a5ad5b2e80ad8bbd27679223ae0ee4a3988a13ba0d186fa",
  "cli:declaration:src/cli/runner.ts:runFix":
    "ad34ab7ff4c57dae5bbbc83933aa143082258ee3b2089234c95240cee82c1125",
  "cli:declaration:src/cli/runner.ts:runReport":
    "e2037ac76dde86d3e10fecc8c6bb558bc517ec89967b961a6578d2372849cc46",
  "cli:declaration:src/cli/runner.ts:SUPPORTED_EXTENSIONS":
    "27c92773118398e615df9df4c7497957850ce331144615a1a9e64369baf23b20",
  "cli:declaration:src/cli/runner.ts:walkDir":
    "3603d1c5a18c5fd43d05666f077be9f665502d8b4898597b1ae8822b10532d76",
  "cli:declaration:src/cli/runner.ts:walkEntry":
    "2818e429d023efb07f2b0e44f4ea79ba6aa9f8ab4fb504355f234d6203477c98",
  "cli:module:src/cli/args.ts":
    "d401092bccd0c7006779a1b4c991bd477e24fd777058a139a93fb4130234e4a4",
  "cli:module:src/cli/index.ts":
    "bbe0cc68c6ee9b225be6948fe2b1dc12ebf88f4c986565ced2e40e3afbbc83c9",
  "cli:module:src/cli/runner.ts":
    "968ad66a1b7878c5deb81367d65c127f55091c1b00ddb3b164f03889ea3f6216",
  "cli:statement:src/cli/index.ts:0":
    "496849c3a4c5e9500881d56f1ef3f5f3bf4cd1bd7e56f5099a5c1f777d237476",
  "reporter:declaration:src/reporter/format.ts:CATEGORY_WIDTH":
    "81b2da5c1ffe6c3c8346fe3668dd58997650c740e5f343da88359fc8c3245a90",
  "reporter:declaration:src/reporter/format.ts:countByCategory":
    "03ff19d83be72ab78ed066bde506b9ab0f92c6978016cf28e1290ed6b0851225",
  "reporter:declaration:src/reporter/format.ts:formatReport":
    "c6236ccb57da2dfa1c121146b8dcc274fad57bc7d4dc70c8a268a37a4f60ae67",
  "reporter:declaration:src/reporter/format.ts:formatResultLines":
    "0e953e439b1d45f251b41b4497f0f9dd0b0a6605a620582d1c3a5cc9d5f9e074",
  "reporter:declaration:src/reporter/format.ts:formatViolationLine":
    "6f288d66bb3a18785d8c174588e593b9afab84f54313ac253eba59cc748b109b",
  "reporter:declaration:src/reporter/format.ts:padRight":
    "3828bb03fe656dd4ad74bbfe4309377e4ad67d69b1276025167454b492e34114",
  "reporter:declaration:src/reporter/format.ts:RULE_WIDTH":
    "3b9b115045055f266016c9f0559ea9b119f0c6eb32ab14a1c2fb4b8ea03702c2",
  "reporter:declaration:src/reporter/index.ts:formatReport":
    "d5981a244a82e6d5ed231276d47175cd8f1c306125b00423856503d5e1681a95",
  "reporter:declaration:src/reporter/index.ts:reportFile":
    "33a2d17ac98f0e1e6f26f0d4c60d2d41c7d47c4ac44d8b9c38a90488214da8f6",
  "reporter:declaration:src/reporter/rules.ts:violationPasses":
    "6a59bc002a4b92cefa3edb3cf0ffa5cd82863905315c6eed23b83d3fdff37c3a",
  "reporter:declaration:src/reporter/run.ts:createViolationCollector":
    "2d2cfb8be2ef607856c5b5270f62b0df4b7753df753ffd03a364ba884097f5f2",
  "reporter:declaration:src/reporter/run.ts:runReport":
    "c5c876aa52788bcc5546ee267f5064a6f54dcefcf13b3b3d406bc44af7aca70c",
  "reporter:module:src/reporter/format.ts":
    "89a176df01595926398e04c0152b3ed12c7366e06a91260448a0a09732f8bddc",
  "reporter:module:src/reporter/index.ts":
    "fd7196ad5986bd71b54c40affb35d185a1845d38501908680211d8470b3c7dbb",
  "reporter:module:src/reporter/rules.ts":
    "d6523add277ae961567a87c252e77b32c3f52c3a34b4717f392313e047600ea7",
  "reporter:module:src/reporter/run.ts":
    "d200a0da1a7b6eee530e448873e5a06af300a6709e2fa6749be8c37631e55121",
};

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
