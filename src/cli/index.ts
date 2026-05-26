import { parseArgs } from "./args.js";
import { run } from "./runner.js";

function main(): void {
  const args = parseArgs(process.argv);

  if (args.patterns.length === 0) {
    console.error("Usage: bedrock <file/glob...> [--fix] [--report]");
    process.exit(1);
  }

  const result = run(args.patterns, args.fix, args.report);

  if (result.output.length > 0) {
    console.log(result.output);
  }

  process.exit(result.exitCode);
}

main();
