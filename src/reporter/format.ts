import type { ReportResult, AnnotatedViolation } from "./run.js";

const CATEGORY_WIDTH = 18;
const RULE_WIDTH = 20;

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function formatViolationLine(violation: AnnotatedViolation): string {
  const lineLabel = `line ${violation.line}`;
  const categoryLabel = `[${violation.category}]`;
  return `  ${padRight(lineLabel, 8)} ${padRight(categoryLabel, CATEGORY_WIDTH)} ${padRight(violation.ruleName, RULE_WIDTH)} ${violation.message}`;
}

function countByCategory(violations: AnnotatedViolation[]): {
  canonical: number;
  typelevel: number;
  externalBoundary: number;
} {
  let canonical = 0;
  let typelevel = 0;
  let externalBoundary = 0;
  for (const v of violations) {
    if (v.category === "canonical") {
      canonical = canonical + 1;
    } else if (v.category === "type-level") {
      typelevel = typelevel + 1;
    } else if (v.category === "external-boundary") {
      externalBoundary = externalBoundary + 1;
    }
  }
  return { canonical, typelevel, externalBoundary };
}

export function formatReport(results: ReportResult[]): string {
  const lines: string[] = [];

  let totalViolations = 0;
  let totalCanonical = 0;
  let totalTypelevel = 0;
  let totalExternalBoundary = 0;

  for (const result of results) {
    if (result.violations.length === 0) {
      continue;
    }
    lines.push(result.filePath);
    for (const violation of result.violations) {
      lines.push(formatViolationLine(violation));
    }
    lines.push("");

    const counts = countByCategory(result.violations);
    totalViolations = totalViolations + result.violations.length;
    totalCanonical = totalCanonical + counts.canonical;
    totalTypelevel = totalTypelevel + counts.typelevel;
    totalExternalBoundary = totalExternalBoundary + counts.externalBoundary;
  }

  const fileCount = results.length;
  const fileWord = fileCount === 1 ? "file" : "files";
  const violationWord = totalViolations === 1 ? "violation" : "violations";
  lines.push(
    `${fileCount} ${fileWord}, ${totalViolations} ${violationWord} (${totalCanonical} canonical, ${totalTypelevel} type-level, ${totalExternalBoundary} external-boundary)`,
  );

  return lines.join("\n");
}
