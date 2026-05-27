export type ParsedArgs = {
  patterns: string[];
  fix: boolean;
  report: boolean;
};

const FIX_FLAG = "--fix";
const REPORT_FLAG = "--report";

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  const fix = args.includes(FIX_FLAG);
  const report = args.includes(REPORT_FLAG);

  const patterns: string[] = [];
  for (const arg of args) {
    if (arg !== FIX_FLAG) {
      if (arg !== REPORT_FLAG) {
        patterns.push(arg);
      }
    }
  }

  // Default to report if no flag given
  let effectiveReport = report;
  if (!fix) {
    if (!report) {
      effectiveReport = true;
    }
  }
  const effectiveFix = fix;

  return { patterns, fix: effectiveFix, report: effectiveReport };
}
