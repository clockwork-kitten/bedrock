import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { transform } from "../transformer/index.js";
import { reportFile, formatReport } from "../reporter/index.js";
import type { TransformPass } from "../transformer/index.js";
import type { ReportResult } from "../reporter/index.js";
import { varToConst } from "../rules/var-to-const/index.js";
import { equalityToStrict } from "../rules/equality/index.js";
import { forOfToIndexed, forInToIndexed, whileToFor, transformForEach } from "../rules/loops/index.js";
import {
  transformPush,
  transformUnshift,
  transformSort,
  transformSparseArrays,
} from "../rules/immutable-array/index.js";
import { transformHasOwnProperty } from "../rules/immutable-object/index.js";
import { arrowToFunctionExpression, transformDefaultParams } from "../rules/no-arrow-functions/index.js";
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
  transformForEach,
  transformPush,
  transformUnshift,
  transformSort,
  transformSparseArrays,
  transformHasOwnProperty,
  arrowToFunctionExpression,
  transformDefaultParams,
  compoundAssignToExplicit,
  updateExpressionToExplicit,
  rewriteTemplateLiterals,
];

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isSupported(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(extname(filePath));
}

function walkEntry(dir: string, entry: string, results: string[]): void {
  const full = join(dir, entry);
  let stat;
  try {
    stat = statSync(full);
  } catch {
    return;
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

function walkDir(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    walkEntry(dir, entry, results);
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
  for (; i < pattern.length; ) {
    const char = pattern[i];
    if (char === "*") {
      if (pattern[i + 1] === "*") {
        regexStr = regexStr + ".*";
        i = i + 2;
        if (pattern[i] === "/") {
          i = i + 1;
        }
      } else {
        regexStr = regexStr + "[^/]*";
        i = i + 1;
      }
    } else if (char === "?") {
      regexStr = regexStr + "[^/]";
      i = i + 1;
    } else if (char !== undefined && ".+^${}()|[]\\".includes(char)) {
      regexStr = regexStr + "\\" + char;
      i = i + 1;
    } else {
      regexStr = regexStr + char;
      i = i + 1;
    }
  }
  return new RegExp("^" + regexStr + "$");
}

function isGlobPattern(pattern: string): boolean {
  if (pattern.includes("*")) {
    return true;
  }
  if (pattern.includes("?")) {
    return true;
  }
  return false;
}

function addFileIfNew(files: string[], f: string): void {
  if (!files.includes(f)) {
    files.push(f);
  }
}

function resolveDirectPattern(pattern: string, files: string[]): void {
  try {
    const stat = statSync(pattern);
    if (stat.isDirectory()) {
      const found = walkDir(pattern);
      for (const f of found) {
        addFileIfNew(files, f);
      }
    } else if (isSupported(pattern)) {
      addFileIfNew(files, pattern);
    }
  } catch {
    // File not found — skip
  }
}

function findBaseIndex(parts: string[]): number {
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes("*")) {
      return i;
    }
    if (parts[i].includes("?")) {
      return i;
    }
  }
  return parts.length;
}

function resolveGlobPattern(pattern: string, files: string[]): void {
  const parts = pattern.split("/");
  const baseIndex = findBaseIndex(parts);

  let baseDir: string;
  if (baseIndex === 0) {
    baseDir = ".";
  } else {
    baseDir = parts.slice(0, baseIndex).join("/");
  }
  const regex = globToRegex(pattern);

  let allFiles: string[];
  try {
    allFiles = walkDir(baseDir);
  } catch {
    return;
  }

  for (const f of allFiles) {
    const normalizedF = f.replaceAll("\\", "/");
    const normalizedPattern = pattern.replaceAll("\\", "/");
    const testRegex = globToRegex(normalizedPattern);
    if (testRegex.test(normalizedF)) {
      addFileIfNew(files, f);
    } else if (regex.test(f)) {
      addFileIfNew(files, f);
    }
  }
}

export function resolvePatterns(patterns: string[]): string[] {
  const files: string[] = [];

  for (const pattern of patterns) {
    if (!isGlobPattern(pattern)) {
      resolveDirectPattern(pattern, files);
    } else {
      resolveGlobPattern(pattern, files);
    }
  }

  return files;
}

export type RunResult = {
  exitCode: number;
  output: string;
};

function detectParser(filePath: string): "ts" | "babel" {
  if (filePath.endsWith(".ts")) {
    return "ts";
  }
  if (filePath.endsWith(".tsx")) {
    return "ts";
  }
  return "babel";
}

export function runFix(files: string[]): { changed: string[]; output: string } {
  const changed: string[] = [];
  const lines: string[] = [];

  for (const filePath of files) {
    const source = readFileSync(filePath, "utf-8");
    const parser = detectParser(filePath);
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
  let exitCode: number;
  if (hasViolations) {
    exitCode = 1;
  } else {
    exitCode = 0;
  }

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
