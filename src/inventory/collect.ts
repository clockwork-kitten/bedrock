import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { rules } from "../rules/registry.js";
import { BEHAVIOR_CONTRACT_CATALOG } from "./constants.js";
import type { FixtureHash, SourceFacts, SuppressionHit, SurfaceFact } from "./types.js";

const RULES_DIR = "src/rules";
const FIXTURES_DIR = "src/__fixtures__";
const WORKFLOWS_DIR = ".github/workflows";
const GENERATED_INVENTORY_PATHS = new Set([
  "docs/bedrock-consumers.json",
  "docs/bedrock-disposition.json",
  "docs/bedrock-freeze.md",
]);
const BEHAVIOR_SOURCE_PATHS = [
  "src/cli/args.ts",
  "src/cli/index.ts",
  "src/cli/runner.ts",
  "src/reporter/format.ts",
  "src/reporter/index.ts",
  "src/reporter/rules.ts",
  "src/reporter/run.ts",
] as const;
function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

function walkFiles(rootDir: string): string[] {
  const results: string[] = [];
  for (const item of readdirSync(rootDir)) {
    const itemPath = join(rootDir, item);
    if (statSync(itemPath).isDirectory()) {
      results.push(...walkFiles(itemPath));
    } else {
      results.push(itemPath);
    }
  }
  return results;
}

function trackedPaths(repoRoot: string): string[] {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\0")
    .filter(function (path) {
      return path.length > 0;
    })
    .sort();
}

function collectSourceFingerprint(repoRoot: string, paths: string[]): string {
  const hash = createHash("sha256");
  for (const path of paths) {
    if (GENERATED_INVENTORY_PATHS.has(path)) {
      continue;
    }
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(join(repoRoot, path)));
    hash.update("\0");
  }
  return "sha256:" + hash.digest("hex");
}

function extractSymbolList(source: string, marker: "TransformPass" | "ViolationPass"): string[] {
  const regex = new RegExp("export const\\s+(\\w+):\\s+" + marker, "g");
  return Array.from(source.matchAll(regex), function (match) {
    const symbol = match[1];
    if (symbol === undefined) {
      throw new Error("Unable to parse exported " + marker + " symbol");
    }
    return symbol;
  });
}

function extractCliWiredFixers(repoRoot: string): string[] {
  const source = readFileSync(join(repoRoot, "src/cli/runner.ts"), "utf8");
  const body = source.match(/const ALL_TRANSFORM_PASSES:[^=]+=\s*\[(?<body>[\s\S]*?)\];/)?.groups
    ?.body;
  if (body === undefined) {
    throw new Error("Unable to parse ALL_TRANSFORM_PASSES from src/cli/runner.ts");
  }
  return body
    .split(",")
    .map(function (entry) {
      return entry.trim();
    })
    .filter(Boolean);
}

function extractReporterWiring(repoRoot: string): Array<{ symbol: string; reporterId: string }> {
  const source = readFileSync(join(repoRoot, "src/reporter/rules.ts"), "utf8");
  return Array.from(
    source.matchAll(/\{\s*ruleName:\s*"([^"]+)",\s*pass:\s*(\w+)\s*\}/g),
    function (match) {
      const reporterId = match[1];
      const symbol = match[2];
      if (reporterId === undefined || symbol === undefined) {
        throw new Error("Unable to parse reporter wiring");
      }
      return { symbol, reporterId };
    },
  );
}

function collectRuleModuleSymbols(
  repoRoot: string,
): { transformSymbols: string[]; detectorSymbols: string[] } {
  const transforms: string[] = [];
  const detectors: string[] = [];
  for (const moduleDir of readdirSync(join(repoRoot, RULES_DIR))) {
    const indexPath = join(repoRoot, RULES_DIR, moduleDir, "index.ts");
    if (!statSync(join(repoRoot, RULES_DIR, moduleDir)).isDirectory()) {
      continue;
    }
    try {
      const source = readFileSync(indexPath, "utf8");
      transforms.push(...extractSymbolList(source, "TransformPass"));
      detectors.push(...extractSymbolList(source, "ViolationPass"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
  return { transformSymbols: transforms.sort(), detectorSymbols: detectors.sort() };
}

function collectFixtureHashes(repoRoot: string): FixtureHash[] {
  const fixturesRoot = join(repoRoot, FIXTURES_DIR);
  const fixtureFiles = walkFiles(fixturesRoot).filter(function (path) {
    return path.includes(".input.") || path.includes(".output.");
  });
  const inputFiles = fixtureFiles.filter(function (path) {
    return path.includes(".input.");
  });
  const outputFiles = fixtureFiles.filter(function (path) {
    return path.includes(".output.");
  });
  const expectedOutputs = new Set(
    inputFiles.map(function (path) {
      return path.replace(".input.", ".output.");
    }),
  );
  const missingOutputs = [...expectedOutputs].filter(function (path) {
    return !outputFiles.includes(path);
  });
  const orphanOutputs = outputFiles.filter(function (path) {
    return !expectedOutputs.has(path);
  });
  if (missingOutputs.length > 0 || orphanOutputs.length > 0) {
    throw new Error(
      "Unmatched fixture halves; missing outputs: " +
        missingOutputs.join(", ") +
        "; orphan outputs: " +
        orphanOutputs.join(", "),
    );
  }
  return inputFiles.sort().map(function (inputPath) {
    const outputPath = inputPath.replace(".input.", ".output.");
    return {
      fixtureId: relative(fixturesRoot, inputPath).replace(".input.", "."),
      inputPath: relative(repoRoot, inputPath),
      outputPath: relative(repoRoot, outputPath),
      inputSha256: sha256(readFileSync(inputPath)),
      outputSha256: sha256(readFileSync(outputPath)),
    };
  });
}

function parseWorkflowJobs(workflowContents: string): string[] {
  const jobs: string[] = [];
  let inJobs = false;
  for (const line of workflowContents.split("\n")) {
    if (line.startsWith("jobs:")) {
      inJobs = true;
      continue;
    }
    if (!inJobs) {
      continue;
    }
    const match = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
    if (match?.[1] !== undefined) {
      jobs.push(match[1]);
    } else if (!line.startsWith("  ") && line.trim().length > 0) {
      break;
    }
  }
  return jobs;
}

function declarationName(statement: ts.Statement): string | undefined {
  if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
    return statement.name.text;
  }
  if (ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1) {
    const declaration = statement.declarationList.declarations[0];
    if (
      declaration !== undefined &&
      ts.isIdentifier(declaration.name) &&
      declaration.initializer !== undefined
    ) {
      return declaration.name.text;
    }
  }
  return undefined;
}

export function discoverBehaviorSurfaces(
  source: string,
  sourcePath: string,
  kind: "cli-contract" | "reporter-contract",
): SurfaceFact[] {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const prefix = kind === "cli-contract" ? "cli" : "reporter";
  const rows: SurfaceFact[] = [];
  let executableStatementIndex = 0;
  for (const statement of sourceFile.statements) {
    const name = declarationName(statement);
    if (name !== undefined) {
      const declarationSource = source.slice(statement.getStart(sourceFile), statement.end);
      rows.push({
        id: prefix + ":declaration:" + sourcePath + ":" + name,
        kind,
        sourcePath,
        sourceSha256: sha256(declarationSource),
      });
    } else if (ts.isExpressionStatement(statement)) {
      const statementSource = source.slice(statement.getStart(sourceFile), statement.end);
      rows.push({
        id: prefix + ":statement:" + sourcePath + ":" + executableStatementIndex,
        kind,
        sourcePath,
        sourceSha256: sha256(statementSource),
      });
      executableStatementIndex += 1;
    }
  }
  return rows;
}

export function assertBehaviorContractCatalog(
  discovered: SurfaceFact[],
  catalog: Record<string, string>,
): void {
  const discoveredById = new Map(
    discovered.map(function (surface) {
      return [surface.id, surface.sourceSha256 ?? ""];
    }),
  );
  const missing = Object.keys(catalog).filter(function (id) {
    return !discoveredById.has(id);
  });
  const unknown = [...discoveredById.keys()].filter(function (id) {
    return catalog[id] === undefined;
  });
  const changed = [...discoveredById].filter(function ([id, hash]) {
    return catalog[id] !== undefined && catalog[id] !== hash;
  });
  if (missing.length > 0 || unknown.length > 0 || changed.length > 0) {
    throw new Error(
      "Behavior contract catalog drift; missing: " +
        missing.sort().join(", ") +
        "; unknown: " +
        unknown.sort().join(", ") +
        "; changed: " +
        changed
          .map(function ([id]) {
            return id;
          })
          .sort()
          .join(", "),
    );
  }
}

function collectBehaviorSurfaces(repoRoot: string): SurfaceFact[] {
  const surfaces = BEHAVIOR_SOURCE_PATHS.flatMap(function (sourcePath) {
    const kind = sourcePath.startsWith("src/cli/")
      ? ("cli-contract" as const)
      : ("reporter-contract" as const);
    return discoverBehaviorSurfaces(
      readFileSync(join(repoRoot, sourcePath), "utf8"),
      sourcePath,
      kind,
    );
  }).sort(function (a, b) {
    return a.id.localeCompare(b.id);
  });
  assertBehaviorContractCatalog(surfaces, BEHAVIOR_CONTRACT_CATALOG);
  return surfaces;
}

function collectPackageAndScriptSurfaces(repoRoot: string): SurfaceFact[] {
  const packagePaths = ["package.json", "packages/eslint-config-bedrock/package.json"];
  const rows: SurfaceFact[] = [];
  for (const packagePath of packagePaths) {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, packagePath), "utf8")) as {
      name: string;
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    rows.push({
      id: "package:" + packageJson.name,
      kind: "package-identity",
      sourcePath: packagePath,
    });
    for (const binName of Object.keys(packageJson.bin ?? {}).sort()) {
      rows.push({
        id: "package-bin:" + packageJson.name + ":" + binName,
        kind: "package-bin",
        sourcePath: packagePath,
      });
    }
    for (const scriptName of Object.keys(packageJson.scripts ?? {}).sort()) {
      rows.push({
        id: "package-script:" + packageJson.name + ":" + scriptName,
        kind: "package-script",
        sourcePath: packagePath,
      });
    }
  }
  for (const filename of readdirSync(join(repoRoot, "scripts")).filter(function (name) {
    return name.endsWith(".ts");
  }).sort()) {
    rows.push({
      id: "script-file:scripts/" + filename,
      kind: "script-file",
      sourcePath: "scripts/" + filename,
    });
  }
  for (const path of [
    "RULES.md",
    "eslint-config-bedrock.json",
    "packages/eslint-config-bedrock/index.js",
  ]) {
    rows.push({ id: "generated-artifact:" + path, kind: "config-artifact", sourcePath: path });
  }
  return rows;
}

function collectWorkflowSurfaces(repoRoot: string): SurfaceFact[] {
  const rows: SurfaceFact[] = [];
  for (const filename of readdirSync(join(repoRoot, WORKFLOWS_DIR))
    .filter(function (name) {
      return name.endsWith(".yml") || name.endsWith(".yaml");
    })
    .sort()) {
    const path = WORKFLOWS_DIR + "/" + filename;
    rows.push({ id: "workflow:" + path, kind: "workflow", sourcePath: path });
    for (const job of parseWorkflowJobs(readFileSync(join(repoRoot, path), "utf8"))) {
      rows.push({
        id: "workflow-job:" + path + ":" + job,
        kind: "workflow-job",
        sourcePath: path,
      });
    }
  }
  return rows;
}

export function classifySuppressionHit(
  path: string,
  term: SuppressionHit["term"],
  text: string,
): SuppressionHit["classification"] {
  const scannerReference =
    path.startsWith("src/inventory/") &&
    (/Suppression|suppression/.test(text) ||
      (path === "src/inventory/collect.ts" &&
        /scannerReference|text\.includes|matchAll|path\.endsWith|term ===|terms:|\.test\(text\)/.test(
          text,
        )) ||
      (path === "src/inventory/types.ts" && /term:/.test(text)) ||
      (path.endsWith(".test.ts") &&
        /^\s*["'`].*(?:disable|ignore|suppress)/i.test(text)));
  if (scannerReference) {
    return "scanner-implementation";
  }
  if (path === "knip.json" && term === "ignore" && text.includes('"ignore"')) {
    return "external-tool-config";
  }
  if (
    path === "src/rules/immutable-object/index.ts" &&
    term === "ignore" &&
    text.includes("violation can be ignored")
  ) {
    return "narrative";
  }
  if (
    path === "src/testing/fixture-runner.test.ts" &&
    term === "suppress" &&
    text.includes("Suppress unused-variable lint")
  ) {
    return "narrative";
  }
  if (
    path === "README.md" &&
    term === "suppress" &&
    text.includes("rejects unknown suppression or consumer-query results")
  ) {
    return "narrative";
  }
  throw new Error("Unclassified suppression search hit: " + path + ": " + text.trim());
}

function collectSuppressionHits(repoRoot: string, paths: string[]): SuppressionHit[] {
  const hits: SuppressionHit[] = [];
  for (const path of paths) {
    if (GENERATED_INVENTORY_PATHS.has(path)) {
      continue;
    }
    const buffer = readFileSync(join(repoRoot, path));
    if (buffer.includes(0)) {
      continue;
    }
    for (const [index, text] of buffer.toString("utf8").split("\n").entries()) {
      const terms = new Set<SuppressionHit["term"]>();
      for (const match of text.toLowerCase().matchAll(/suppress|ignore|disable/g)) {
        terms.add(match[0] as SuppressionHit["term"]);
      }
      for (const term of terms) {
        hits.push({
          path,
          line: index + 1,
          term,
          text: text.trim(),
          classification: classifySuppressionHit(path, term, text),
        });
      }
    }
  }
  return hits;
}

export function collectSourceFacts(repoRoot: string): SourceFacts {
  const paths = trackedPaths(repoRoot);
  const moduleSymbols = collectRuleModuleSymbols(repoRoot);
  const wiredInReporter = extractReporterWiring(repoRoot);
  return {
    sourceFingerprint: collectSourceFingerprint(repoRoot, paths),
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
    reporterIds: Array.from(
      new Set(
        wiredInReporter.map(function (row) {
          return row.reporterId;
        }),
      ),
    ).sort(),
    fixtureHashes: collectFixtureHashes(repoRoot),
    surfaces: [
      ...collectBehaviorSurfaces(repoRoot),
      ...collectPackageAndScriptSurfaces(repoRoot),
      ...collectWorkflowSurfaces(repoRoot),
    ].sort(function (a, b) {
      return a.id.localeCompare(b.id);
    }),
    suppressionSearch: {
      scope: "all git-tracked textual files",
      terms: ["disable", "ignore", "suppress"],
      excludedPaths: [...GENERATED_INVENTORY_PATHS].sort(),
    },
    suppressionHits: collectSuppressionHits(repoRoot, paths),
  };
}
