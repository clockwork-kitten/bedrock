import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { transform } from "../transformer/index.js";
import { reportFile, formatReport } from "../reporter/index.js";
import type { TransformPass } from "../transformer/index.js";
import type { ReportResult } from "../reporter/index.js";
import { varToConst } from "../rules/var-to-const/index.js";
import { equalityToStrict } from "../rules/equality/index.js";
import { forOfToIndexed, forInToIndexed, whileToFor } from "../rules/loops/index.js";
import {
  transformPush,
  transformUnshift,
  transformSort,
  transformSparseArrays,
} from "../rules/immutable-array/index.js";
import { transformHasOwnProperty } from "../rules/immutable-object/index.js";
import { arrowToFunctionExpression } from "../rules/no-arrow-functions/index.js";
import {
  compoundAssignToExplicit,
  updateExpressionToExplicit,
} from "../rules/no-shorthand-operators/index.js";
import { rewriteTemplateLiterals } from "../rules/no-template-literals/index.js";

const ALL_TRANSFORM_PASSES: TransformPass[] = [
  varToConst,
  equalityToStrict,
  forOfToIndexed,
  forInToIndexed,
  whileToFor,
  transformPush,
  transformUnshift,
  transformSort,
  transformSparseArrays,
  transformHasOwnProperty,
  arrowToFunctionExpression,
  compoundAssignToExplicit,
  updateExpressionToExplicit,
  rewriteTemplateLiterals,
];

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isSupported(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(extname(filePath));
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      const nested = walkDir(full);
      for (const f of nested) {
        results.push(f);
      }
    } else if (isSupported(full)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Converts a glob pattern to a RegExp.
 * Supports * (any non-slash chars) and ** (any chars including slashes).
 */
function globToRegex(pattern: string): RegExp {
  let regexStr = "";
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      regexStr = regexStr + ".*";
      i = i + 2;
      if (pattern[i] === "/") {
        i = i + 1;
      }
    } else if (pattern[i] === "*") {
      regexStr = regexStr + "[^/]*";
      i = i + 1;
    } else if (pattern[i] === "?") {
      regexStr = regexStr + "[^/]";
      i = i + 1;
    } else if (".+^${}()|[]\\".includes(pattern[i] as string)) {
      regexStr = regexStr + "\\" + pattern[i];
      i = i + 1;
    } else {
      regexStr = regexStr + pattern[i];
      i = i + 1;
    }
  }
  return new RegExp("^" + regexStr + "$");
}

function isGlobPattern(pattern: string): boolean {
  return pattern.includes("*") || pattern.includes("?");
}

export function resolvePatterns(patterns: string[]): string[] {
  const files: string[] = [];

  for (const pattern of patterns) {
    if (!isGlobPattern(pattern)) {
      // Direct file or directory path
      try {
        const stat = statSync(pattern);
        if (stat.isDirectory()) {
          const found = walkDir(pattern);
          for (const f of found) {
            if (!files.includes(f)) {
              files.push(f);
            }
          }
        } else if (isSupported(pattern)) {
          if (!files.includes(pattern)) {
            files.push(pattern);
          }
        }
      } catch {
        // File not found — skip
      }
      continue;
    }

    // Glob pattern: find the base directory (non-glob prefix)
    const parts = pattern.split("/");
    let baseIndex = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes("*") || parts[i].includes("?")) {
        baseIndex = i;
        break;
      }
      baseIndex = i + 1;
    }

    const baseDir = baseIndex === 0 ? "." : parts.slice(0, baseIndex).join("/");
    const regex = globToRegex(pattern);

    let allFiles: string[];
    try {
      allFiles = walkDir(baseDir);
    } catch {
      continue;
    }

    for (const f of allFiles) {
      const normalizedF = f.replaceAll("\\", "/");
      const normalizedPattern = pattern.replaceAll("\\", "/");
      const testRegex = globToRegex(normalizedPattern);
      if (testRegex.test(normalizedF) || regex.test(f)) {
        if (!files.includes(f)) {
          files.push(f);
        }
      }
    }
  }

  return files;
}

export type RunResult = {
  exitCode: number;
  output: string;
};

export function runFix(files: string[]): { changed: string[]; output: string } {
  const changed: string[] = [];
  const lines: string[] = [];

  for (const filePath of files) {
    const source = readFileSync(filePath, "utf-8");
    const parser = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "ts" : "babel";
    const result = transform(source, { parser, passes: ALL_TRANSFORM_PASSES });

    if (result.changed) {
      writeFileSync(filePath, result.source, "utf-8");
      changed.push(filePath);
    }
  }

  if (changed.length === 0) {
    lines.push("No files changed.");
  } else {
    lines.push("Fixed " + changed.length + " file(s):");
    for (const f of changed) {
      lines.push("  " + f);
    }
  }

  return { changed, output: lines.join("\n") };
}

export function runReport(
  files: string[],
): { results: ReportResult[]; output: string; exitCode: number } {
  const results: ReportResult[] = [];

  for (const filePath of files) {
    const source = readFileSync(filePath, "utf-8");
    results.push(reportFile(filePath, source));
  }

  const groundedCount = results.filter(function (r) {
    return r.isGrounded;
  }).length;

  const reportOutput = formatReport(results);
  const groundedLine =
    groundedCount +
    " of " +
    results.length +
    " file(s) grounded (zero external-boundary violations).";

  const hasViolations = results.some(function (r) {
    return r.violations.length > 0;
  });

  const output = reportOutput + "\n" + groundedLine;
  const exitCode = hasViolations ? 1 : 0;

  return { results, output, exitCode };
}

export function run(patterns: string[], fix: boolean, report: boolean): RunResult {
  const files = resolvePatterns(patterns);

  if (files.length === 0) {
    return { exitCode: 0, output: "No files matched the given patterns." };
  }

  const outputParts: string[] = [];

  if (fix) {
    const fixResult = runFix(files);
    outputParts.push(fixResult.output);
  }

  if (report) {
    const reportResult = runReport(files);
    outputParts.push(reportResult.output);
    return { exitCode: reportResult.exitCode, output: outputParts.join("\n\n") };
  }

  return { exitCode: 0, output: outputParts.join("\n\n") };
}
