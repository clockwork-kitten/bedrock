import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { rules } from "../rules/registry.js";
import type { FixtureHash, SourceFacts } from "./types.js";

const RULES_DIR = "src/rules";
const FIXTURES_DIR = "src/__fixtures__";
const WORKFLOWS_DIR = ".github/workflows";

function sha256(contents: string): string {
  const hash = createHash("sha256");
  hash.update(contents, "utf8");
  return hash.digest("hex");
}

function walkFiles(rootDir: string): string[] {
  const items = readdirSync(rootDir);
  const results: string[] = [];
  for (const item of items) {
    const itemPath = join(rootDir, item);
    const stat = statSync(itemPath);
    if (stat.isDirectory()) {
      for (const nested of walkFiles(itemPath)) {
        results.push(nested);
      }
      continue;
    }
    results.push(itemPath);
  }
  return results;
}

function extractSymbolList(source: string, marker: "TransformPass" | "ViolationPass"): string[] {
  const regex = new RegExp("export const\\s+(\\w+):\\s+" + marker, "g");
  const symbols: string[] = [];
  for (const match of source.matchAll(regex)) {
    const symbol = match[1];
    if (symbol !== undefined) {
      symbols.push(symbol);
    }
  }
  return symbols;
}

function extractCliWiredFixers(repoRoot: string): string[] {
  const runnerPath = join(repoRoot, "src/cli/runner.ts");
  const source = readFileSync(runnerPath, "utf8");
  const blockMatch = source.match(
    /const ALL_TRANSFORM_PASSES:[^=]+=\s*\[(?<body>[\s\S]*?)\];/,
  );
  const body = blockMatch?.groups?.body;
  if (body === undefined) {
    throw new Error("Unable to parse ALL_TRANSFORM_PASSES from src/cli/runner.ts");
  }
  return body
    .split(",")
    .map(function (entry) {
      return entry.trim();
    })
    .filter(function (entry) {
      return entry.length > 0;
    });
}

function extractReporterWiring(repoRoot: string): Array<{ symbol: string; reporterId: string }> {
  const rulesPath = join(repoRoot, "src/reporter/rules.ts");
  const source = readFileSync(rulesPath, "utf8");
  const regex = /\{\s*ruleName:\s*"([^"]+)",\s*pass:\s*(\w+)\s*\}/g;
  const rows: Array<{ symbol: string; reporterId: string }> = [];
  for (const match of source.matchAll(regex)) {
    const reporterId = match[1];
    const symbol = match[2];
    if (reporterId !== undefined && symbol !== undefined) {
      rows.push({ symbol, reporterId });
    }
  }
  return rows;
}

function collectRuleModuleSymbols(
  repoRoot: string,
): { transformSymbols: string[]; detectorSymbols: string[] } {
  const rulesRoot = join(repoRoot, RULES_DIR);
  const moduleDirs = readdirSync(rulesRoot);
  const transforms: string[] = [];
  const detectors: string[] = [];

  for (const moduleDir of moduleDirs) {
    const indexPath = join(rulesRoot, moduleDir, "index.ts");
    let source: string;
    try {
      source = readFileSync(indexPath, "utf8");
    } catch {
      continue;
    }
    for (const symbol of extractSymbolList(source, "TransformPass")) {
      transforms.push(symbol);
    }
    for (const symbol of extractSymbolList(source, "ViolationPass")) {
      detectors.push(symbol);
    }
  }

  transforms.sort();
  detectors.sort();
  return { transformSymbols: transforms, detectorSymbols: detectors };
}

function collectFixtureHashes(repoRoot: string): FixtureHash[] {
  const fixturesRoot = join(repoRoot, FIXTURES_DIR);
  const allFixtureFiles = walkFiles(fixturesRoot).filter(function (path) {
    return path.includes(".input.") || path.includes(".output.");
  });
  const inputFiles = allFixtureFiles.filter(function (path) {
    return path.includes(".input.");
  });
  inputFiles.sort();

  const pairs: FixtureHash[] = [];
  for (const inputPath of inputFiles) {
    const outputPath = inputPath.replace(".input.", ".output.");
    const inputSource = readFileSync(inputPath, "utf8");
    const outputSource = readFileSync(outputPath, "utf8");
    pairs.push({
      fixtureId: relative(fixturesRoot, inputPath).replace(".input.", "."),
      inputPath: relative(repoRoot, inputPath),
      outputPath: relative(repoRoot, outputPath),
      inputSha256: sha256(inputSource),
      outputSha256: sha256(outputSource),
    });
  }

  return pairs;
}

function parseWorkflowJobs(workflowContents: string): string[] {
  const lines = workflowContents.split("\n");
  const jobs: string[] = [];
  let inJobs = false;

  for (const line of lines) {
    if (line.startsWith("jobs:")) {
      inJobs = true;
      continue;
    }

    if (!inJobs) {
      continue;
    }

    const match = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
    if (match !== null) {
      jobs.push(match[1]);
      continue;
    }

    if (!line.startsWith("  ") && line.trim().length > 0) {
      break;
    }
  }

  return jobs;
}

function collectWorkflows(repoRoot: string): Array<{ path: string; jobs: string[] }> {
  const workflowsRoot = join(repoRoot, WORKFLOWS_DIR);
  const workflowFiles = readdirSync(workflowsRoot).filter(function (name) {
    return name.endsWith(".yml");
  });
  workflowFiles.sort();

  return workflowFiles.map(function (filename) {
    const fullPath = join(workflowsRoot, filename);
    const source = readFileSync(fullPath, "utf8");
    return {
      path: relative(repoRoot, fullPath),
      jobs: parseWorkflowJobs(source),
    };
  });
}

function collectSuppressionMechanisms(repoRoot: string): number {
  const sourceFiles = walkFiles(join(repoRoot, "src"))
    .filter(function (path) {
      return path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.includes("/inventory/");
    });

  const suppressionSyntaxTokens = ["bedrock-disable", "bedrock-enable", "eslint-disable"];
  for (const sourcePath of sourceFiles) {
    const source = readFileSync(sourcePath, "utf8");
    for (const token of suppressionSyntaxTokens) {
      if (source.includes(token)) {
        return 1;
      }
    }
  }
  return 0;
}

function collectSuppressionNarrativeMentions(repoRoot: string): number {
  const source = walkFiles(join(repoRoot, "src"))
    .filter(function (path) {
      return path.endsWith(".ts") && !path.includes("/inventory/");
    })
    .map(function (path) {
      return readFileSync(path, "utf8");
    })
    .join("\n");

  return source.includes("ignored") ? 1 : 0;
}

export function collectSourceFacts(repoRoot: string, revision: string): SourceFacts {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  const generatedArtifacts = [
    "RULES.md",
    "eslint-config-bedrock.json",
    "packages/eslint-config-bedrock/index.js",
  ];

  const moduleSymbols = collectRuleModuleSymbols(repoRoot);
  const wiredInReporter = extractReporterWiring(repoRoot);
  const reporterIds = Array.from(
    new Set(
      wiredInReporter.map(function (row) {
        return row.reporterId;
      }),
    ),
  ).sort();

  return {
    revision,
    rules: {
      ids: rules.map(function (rule) {
        return rule.id;
      }),
      declaredAutoFixable: rules
        .filter(function (rule) {
          return rule.autoFixable;
        })
        .map(function (rule) {
          return rule.id;
        })
        .sort(),
    },
    fixers: {
      exported: moduleSymbols.transformSymbols,
      wiredInCli: extractCliWiredFixers(repoRoot),
    },
    detectors: {
      exported: moduleSymbols.detectorSymbols,
      wiredInReporter,
    },
    reporterIds,
    fixtureHashes: collectFixtureHashes(repoRoot),
    packageScripts: Object.keys(packageJson.scripts)
      .filter(function (scriptName) {
        return !scriptName.startsWith("inventory:");
      })
      .sort(),
    generatedArtifacts,
    workflows: collectWorkflows(repoRoot),
    suppressionMechanismsCount: collectSuppressionMechanisms(repoRoot),
    suppressionNarrativeMentionsCount: collectSuppressionNarrativeMentions(repoRoot),
  };
}
