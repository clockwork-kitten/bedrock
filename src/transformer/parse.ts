import jscodeshift from "jscodeshift";

const BABEL_PARSER = "babel" as const;
const TS_PARSER = "ts" as const;

export function parseSource(
  source: string,
  parser: "babel" | "ts",
): jscodeshift.Collection {
  const j = jscodeshift.withParser(parser === "babel" ? BABEL_PARSER : TS_PARSER);
  return j(source);
}
