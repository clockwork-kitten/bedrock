import { readdirSync, readFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../transformer/index.js";
import type { TransformPass } from "../transformer/index.js";

const FIXTURES_ROOT = new URL("../__fixtures__", import.meta.url).pathname;

const INPUT_SUFFIX = ".input";
const OUTPUT_SUFFIX = ".output";

export type FixturePair = {
  name: string;
  inputPath: string;
  outputPath: string;
};

export function stripExtension(filename: string): string {
  return filename.slice(0, filename.length - extname(filename).length);
}

export function isInputFile(filename: string): boolean {
  const withoutExt = stripExtension(filename);
  return withoutExt.endsWith(INPUT_SUFFIX);
}

export function fixtureNameFromInputFile(filename: string): string {
  const withoutExt = stripExtension(filename);
  return withoutExt.slice(0, withoutExt.length - INPUT_SUFFIX.length);
}

export function findOutputFile(
  dir: string,
  fixtureName: string,
  allFiles: string[],
): string {
  const match = allFiles.find((f) => {
    const withoutExt = stripExtension(f);
    return withoutExt === fixtureName + OUTPUT_SUFFIX;
  });
  if (match === undefined) {
    throw new Error(
      `No output file found for fixture "${fixtureName}" in ${dir}`,
    );
  }
  return match;
}

export function collectFixturePairs(ruleDir: string): FixturePair[] {
  const files = readdirSync(ruleDir);
  const pairs: FixturePair[] = [];
  for (const file of files) {
    if (!isInputFile(file)) {
      continue;
    }
    const fixtureName = fixtureNameFromInputFile(file);
    const outputFile = findOutputFile(ruleDir, fixtureName, files);
    pairs.push({
      name: fixtureName,
      inputPath: join(ruleDir, file),
      outputPath: join(ruleDir, outputFile),
    });
  }
  return pairs;
}

export function detectParser(filename: string): "ts" | "babel" {
  const ext = extname(filename);
  if (ext === ".ts" || ext === ".tsx") {
    return "ts";
  }
  return "babel";
}

export function runFixturePairs(
  ruleName: string,
  pairs: FixturePair[],
  passes: TransformPass[],
): void {
  describe(`fixtures: ${ruleName}`, function () {
    for (const pair of pairs) {
      it(pair.name, function () {
        const input = readFileSync(pair.inputPath, "utf8");
        const expected = readFileSync(pair.outputPath, "utf8");
        const parser = detectParser(basename(pair.inputPath));
        const result = transform(input, { parser, passes });
        expect(result.source.trim()).toBe(expected.trim());
      });
    }
  });
}

export function runFixtures(ruleName: string, passes: TransformPass[]): void {
  const ruleDir = join(FIXTURES_ROOT, ruleName);
  const pairs = collectFixturePairs(ruleDir);
  runFixturePairs(ruleName, pairs, passes);
}

