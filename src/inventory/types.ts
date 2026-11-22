type SizeSlice = "S" | "M" | "L";

export type RuleDisposition = {
  legacyRuleId: string;
  disposition: "candidate-pending-96" | "dropped";
  rationale: string;
  proposedOwner: "crucible" | null;
  proposedCruxId: string | null;
  authorityIssue: string;
};

export type InventoryRow = {
  id: string;
  kind: string;
  disposition: "candidate-pending-96" | "dropped" | "none";
  rationale: string;
  proposedOwner: string | null;
  proposedCruxId: string | null;
};

export type DownstreamSlice = {
  id: string;
  repository: string;
  size: SizeSlice;
  status: "existing" | "deferred" | "implemented-here";
  notes: string;
};

export type FixtureHash = {
  fixtureId: string;
  inputPath: string;
  outputPath: string;
  inputSha256: string;
  outputSha256: string;
};

export type SourceFacts = {
  revision: string;
  rules: {
    ids: string[];
    declaredAutoFixable: string[];
  };
  fixers: {
    exported: string[];
    wiredInCli: string[];
  };
  detectors: {
    exported: string[];
    wiredInReporter: Array<{ symbol: string; reporterId: string }>;
  };
  reporterIds: string[];
  fixtureHashes: FixtureHash[];
  packageScripts: string[];
  generatedArtifacts: string[];
  workflows: Array<{ path: string; jobs: string[] }>;
  suppressionMechanismsCount: number;
  suppressionNarrativeMentionsCount: number;
};

export type FreezeDispositionDocument = {
  schemaVersion: 1;
  generatedAt: string;
  sourceRevision: string;
  authority: {
    issue: string;
    requirementsIssue: string;
    briefIssue: string;
    permanentIdsAssignedBy: string;
  };
  denominators: {
    registryRuleIds: number;
    reporterIds: number;
    fixerExports: number;
    detectorExports: number;
    detectorWired: number;
    detectorUnwired: number;
    fixturePairs: number;
    packageScripts: number;
    generatedArtifacts: number;
    workflows: number;
    workflowJobs: number;
    suppressions: number;
  };
  mismatchEvidence: {
    declaredAutoFixableRuleIds: string[];
    wiredFixerSymbols: string[];
    wiredFixerRuleIdsNotDeclaredAutoFixable: string[];
    declaredAutoFixableRuleIdsWithoutWiredFixer: string[];
  };
  rules: Array<RuleDisposition & { declaredAutoFixable: boolean; fixerSymbols: string[] }>;
  reporterIds: InventoryRow[];
  fixers: InventoryRow[];
  detectors: Array<InventoryRow & { reporterIds: string[]; wiredInReporter: boolean }>;
  surfaces: InventoryRow[];
  downstreamSlices: DownstreamSlice[];
  fixtureHashes: FixtureHash[];
};
