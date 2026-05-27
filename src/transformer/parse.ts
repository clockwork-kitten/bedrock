import jscodeshift from "jscodeshift";

const BABEL_PARSER = "babel" as const;
const TS_PARSER = "ts" as const;

export function parseSource(
  source: string,
  parser: "babel" | "ts",
): jscodeshift.Collection {
  let selectedParser: typeof BABEL_PARSER | typeof TS_PARSER;
  if (parser === "babel") {
    selectedParser = BABEL_PARSER;
  } else {
    selectedParser = TS_PARSER;
  }
  const j = jscodeshift.withParser(selectedParser);
  return j(source);
}
