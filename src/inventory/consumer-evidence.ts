import type { ConsumerEvidenceCapture } from "./types.js";

const BEDROCK_QUERY =
  "gh search code 'bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url";
const ESLINT_CONFIG_QUERY =
  "gh search code 'eslint-config-bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url";
const CODE_BEDROCK_QUERY =
  "gh search code 'code.bedrock -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url";
const REPORT_QUERY =
  "gh search code '\"bedrock --report\" -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url";
const FIX_QUERY =
  "gh search code '\"bedrock --fix\" -repo:clockwork-kitten/bedrock' --owner clockwork-kitten --limit 100 --json repository,path,url";

export const PINNED_CONSUMER_EVIDENCE: ConsumerEvidenceCapture = {
  capturedAt: "2026-11-22",
  organizationCounts: {
    repositories: 21,
    private: 15,
    public: 6,
  },
  queries: [
    {
      id: "bedrock",
      command: BEDROCK_QUERY,
      results: [
        { repository: "clockwork-kitten/canon", path: "README.md" },
        { repository: "clockwork-kitten/incubator", path: "docs/game-stack-decision.md" },
        { repository: "clockwork-kitten/ops", path: "docs/DECISIONS.md" },
        { repository: "clockwork-kitten/ops", path: "docs/OPS-ROADMAP.md" },
        { repository: "clockwork-kitten/ops", path: "docs/identity.md" },
        { repository: "clockwork-kitten/ops", path: "docs/oss-policy.md" },
        { repository: "clockwork-kitten/standards", path: "README.md" },
        { repository: "clockwork-kitten/standards", path: "ROADMAP.md" },
        {
          repository: "clockwork-kitten/standards",
          path: "docs/STANDARDS-ARCHITECTURE.md",
        },
        { repository: "clockwork-kitten/standards", path: "llms.txt" },
        { repository: "clockwork-kitten/standards", path: "packages/conform/README.md" },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/configs/eslint.base.js",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/code/run.test.ts",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/code/run.ts",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/config/resolve.test.ts",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/config/resolve.ts",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/config/types.ts",
        },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/index.ts",
        },
      ],
    },
    { id: "eslint-config-bedrock", command: ESLINT_CONFIG_QUERY, results: [] },
    {
      id: "code.bedrock",
      command: CODE_BEDROCK_QUERY,
      results: [
        { repository: "clockwork-kitten/standards", path: "README.md" },
        { repository: "clockwork-kitten/standards", path: "ROADMAP.md" },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/src/config/resolve.ts",
        },
      ],
    },
    {
      id: "bedrock --report",
      command: REPORT_QUERY,
      results: [
        { repository: "clockwork-kitten/standards", path: "ROADMAP.md" },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/configs/eslint.base.js",
        },
      ],
    },
    {
      id: "bedrock --fix",
      command: FIX_QUERY,
      results: [
        { repository: "clockwork-kitten/standards", path: "ROADMAP.md" },
        {
          repository: "clockwork-kitten/standards",
          path: "packages/conform/configs/eslint.base.js",
        },
      ],
    },
  ],
  repositoryHeads: {
    "clockwork-kitten/canon": {
      defaultBranch: "main",
      revision: "7162ec763a9e99fbe4ef047e6ffb7fcfb5a8e18c",
    },
    "clockwork-kitten/incubator": {
      defaultBranch: "main",
      revision: "b10e487fc4b8f16e8227f022ab380efd3c6401ed",
    },
    "clockwork-kitten/ops": {
      defaultBranch: "main",
      revision: "7be4f6d33edd65e88d01e60d28c29bb7ee0e7285",
    },
    "clockwork-kitten/standards": {
      defaultBranch: "main",
      revision: "50f290ddce8984ace6f9c7a5e161242f9ee4b0e5",
    },
  },
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
};
