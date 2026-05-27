import type { ReportResult, AnnotatedViolation } from "./run.js";

const CATEGORY_WIDTH = 18;
const RULE_WIDTH = 20;

function padRight(str: string, width: number): string {
  if (str.length >= width) {
    return str;
  }
  return str + " ".repeat(width - str.length);
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

function formatResultLines(result: ReportResult): string[] {
  if (result.violations.length === 0) {
    return [];
  }
  const lines: string[] = [];
  lines.push(result.filePath);
  for (const violation of result.violations) {
    lines.push(formatViolationLine(violation));
  }
  lines.push("");
  return lines;
}

export function formatReport(results: ReportResult[]): string {
  const lines: string[] = [];

  let totalViolations = 0;
  let totalCanonical = 0;
  let totalTypelevel = 0;
  let totalExternalBoundary = 0;

  for (const result of results) {
    const resultLines = formatResultLines(result);
    for (const line of resultLines) {
      lines.push(line);
    }

    if (result.violations.length > 0) {
      const counts = countByCategory(result.violations);
      totalViolations = totalViolations + result.violations.length;
      totalCanonical = totalCanonical + counts.canonical;
      totalTypelevel = totalTypelevel + counts.typelevel;
      totalExternalBoundary = totalExternalBoundary + counts.externalBoundary;
    }
  }

  const fileCount = results.length;
  let fileWord: string;
  if (fileCount === 1) {
    fileWord = "file";
  } else {
    fileWord = "files";
  }
  let violationWord: string;
  if (totalViolations === 1) {
    violationWord = "violation";
  } else {
    violationWord = "violations";
  }
  lines.push(
    `${fileCount} ${fileWord}, ${totalViolations} ${violationWord} (${totalCanonical} canonical, ${totalTypelevel} type-level, ${totalExternalBoundary} external-boundary)`,
  );

  return lines.join("\n");
}
