type SizeSlice = "S" | "M" | "L";

export type RuleDisposition = {
  legacyRuleId: string;
  disposition: "candidate-pending-96" | "dropped";
  rationale: string;
  targetConcept: string | null;
  proposedOwner: "crucible" | null;
  proposedCruxId: null;
  authorityIssue: string;
};

export type InventoryRow = {
  id: string;
  kind: string;
  sourcePath: string;
  disposition: "candidate-pending-96" | "dropped" | "none";
  rationale: string;
  proposedOwner: string | null;
  proposedCruxId: null;
};

export type SurfaceFact = {
  id: string;
  kind:
    | "cli-contract"
    | "config-artifact"
    | "package-bin"
    | "package-identity"
    | "package-script"
    | "reporter-contract"
    | "script-file"
    | "workflow"
    | "workflow-job";
  sourcePath: string;
};

export type SuppressionHit = {
  path: string;
  line: number;
  term: "disable" | "ignore" | "suppress";
  text: string;
  classification: "external-tool-config" | "narrative" | "scanner-implementation";
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
  sourceFingerprint: string;
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
  surfaces: SurfaceFact[];
  suppressionSearch: {
    scope: string;
    terms: string[];
    excludedPaths: string[];
  };
  suppressionHits: SuppressionHit[];
};

export type ConsumerEvidence = {
  observedAt: string;
  boundedUniverse: string;
  organizationCounts: {
    repositories: number;
    private: number;
    public: number;
  };
  queries: Array<{ id: string; command: string }>;
  repositoryRevisions: Record<string, string>;
  results: Array<{
    queryId: string;
    repository: string;
    revision: string;
    path: string;
    classification: "functional-consumer" | "reference-only" | "regression-evidence";
    disposition: string;
  }>;
  npmQueries: Array<{
    command: string;
    result: Record<string, unknown>;
  }>;
  limitations: string;
};

export type FreezeDispositionDocument = {
  schemaVersion: 2;
  generatedAt: string;
  sourceFingerprint: string;
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
    reporterContracts: number;
    cliContracts: number;
    packageIdentities: number;
    packageBins: number;
    packageScripts: number;
    scriptFiles: number;
    generatedArtifacts: number;
    workflows: number;
    workflowJobs: number;
    suppressionSearchHits: number;
    suppressionMechanisms: number;
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
  suppressionSearch: SourceFacts["suppressionSearch"];
  suppressionHits: SuppressionHit[];
  downstreamSlices: DownstreamSlice[];
  fixtureHashes: FixtureHash[];
};
