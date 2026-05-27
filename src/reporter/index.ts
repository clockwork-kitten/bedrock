import { runReport } from "./run.js";
import { formatReport as formatReportImpl } from "./format.js";
import type { ReportResult } from "./run.js";

export type { ReportResult } from "./run.js";

export function reportFile(filePath: string, source: string): ReportResult {
  return runReport(filePath, source);
}

export function formatReport(results: ReportResult[]): string {
  return formatReportImpl(results);
}
