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

  const patterns = args.filter(function (arg) {
    return arg !== FIX_FLAG && arg !== REPORT_FLAG;
  });

  // Default to report if no flag given
  const effectiveReport = report || (!fix && !report);
  const effectiveFix = fix;

  return { patterns, fix: effectiveFix, report: effectiveReport };
}
