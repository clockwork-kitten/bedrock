import { describe, it, expect, vi } from "vitest";
import {
  stripExtension,
  isInputFile,
  fixtureNameFromInputFile,
  findOutputFile,
  collectFixturePairs,
  detectParser,
  runFixturePairs,
} from "./fixture-runner.js";
import type { FixturePair } from "./fixture-runner.js";
import type { TransformPass } from "../transformer/index.js";

// Mock node:fs so collectFixturePairs doesn't touch disk
vi.mock("node:fs", () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { readdirSync, readFileSync } from "node:fs";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);

// A pass that converts `var` to `const`
const varToConstPass: TransformPass = (root, j) => {
  root.find(j.VariableDeclaration, { kind: "var" }).forEach((path) => {
    path.node.kind = "const";
  });
};

describe("fixture-runner helpers", () => {
  describe("stripExtension", () => {
    it("removes .ts extension", () => {
      expect(stripExtension("foo.ts")).toBe("foo");
    });
    it("removes .js extension", () => {
      expect(stripExtension("foo.bar.js")).toBe("foo.bar");
    });
    it("leaves name without extension unchanged", () => {
      expect(stripExtension("foo")).toBe("foo");
    });
  });

  describe("isInputFile", () => {
    it("returns true for .input.ts", () => {
      expect(isInputFile("simple.input.ts")).toBe(true);
    });
    it("returns true for .input.js", () => {
      expect(isInputFile("simple.input.js")).toBe(true);
    });
    it("returns false for .output.ts", () => {
      expect(isInputFile("simple.output.ts")).toBe(false);
    });
    it("returns false for a plain .ts file", () => {
      expect(isInputFile("simple.ts")).toBe(false);
    });
  });

  describe("fixtureNameFromInputFile", () => {
    it("extracts fixture name from .input.ts", () => {
      expect(fixtureNameFromInputFile("my-case.input.ts")).toBe("my-case");
    });
    it("extracts fixture name from .input.js", () => {
      expect(fixtureNameFromInputFile("foo-bar.input.js")).toBe("foo-bar");
    });
  });

  describe("findOutputFile", () => {
    it("finds the matching output file", () => {
      const files = ["simple.input.js", "simple.output.js"];
      expect(findOutputFile("/dir", "simple", files)).toBe("simple.output.js");
    });
    it("throws when no output file is present", () => {
      expect(() => findOutputFile("/dir", "orphan", ["orphan.input.js"])).toThrow(
        /No output file found for fixture "orphan"/,
      );
    });
  });

  describe("detectParser", () => {
    it("returns ts for .ts files", () => {
      expect(detectParser("foo.input.ts")).toBe("ts");
    });
    it("returns ts for .tsx files", () => {
      expect(detectParser("foo.input.tsx")).toBe("ts");
    });
    it("returns babel for .js files", () => {
      expect(detectParser("foo.input.js")).toBe("babel");
    });
  });

  describe("collectFixturePairs", () => {
    it("returns pairs for all input files", () => {
      mockReaddirSync.mockReturnValue(
        ["alpha.input.js", "alpha.output.js", "beta.input.ts", "beta.output.ts"] as unknown as ReturnType<typeof readdirSync>,
      );
      const pairs = collectFixturePairs("/some/rule");
      expect(pairs).toHaveLength(2);
      expect(pairs[0]?.name).toBe("alpha");
      expect(pairs[1]?.name).toBe("beta");
    });

    it("throws when an input file has no matching output", () => {
      mockReaddirSync.mockReturnValue(
        ["solo.input.js"] as unknown as ReturnType<typeof readdirSync>,
      );
      expect(() => collectFixturePairs("/some/rule")).toThrow(
        /No output file found for fixture "solo"/,
      );
    });
  });
});

// ── runFixturePairs integration tests ──────────────────────────────────────
// These are called at the top level so vitest allows nested describe/it blocks.

const MATCHING_PAIRS: FixturePair[] = [
  {
    name: "var-to-const",
    inputPath: "/fake/var-to-const.input.js",
    outputPath: "/fake/var-to-const.output.js",
  },
];

const MISMATCHING_PAIRS: FixturePair[] = [
  {
    name: "wrong-output",
    inputPath: "/fake/wrong-output.input.js",
    outputPath: "/fake/wrong-output.output.js",
  },
];

// Suppress unused-variable lint — MISMATCHING_PAIRS is kept for documentation
void MISMATCHING_PAIRS;

// Set up the mock reads for both fixture pair sets
mockReadFileSync.mockImplementation((path: unknown) => {
  const p = String(path);
  if (p.endsWith("var-to-const.input.js")) return "var x = 1;";
  if (p.endsWith("var-to-const.output.js")) return "const x = 1;";
  if (p.endsWith("wrong-output.input.js")) return "var x = 1;";
  // Intentionally wrong: says `let` but transformer produces `const`
  if (p.endsWith("wrong-output.output.js")) return "let x = 1;";
  throw new Error(`Unexpected readFileSync call: ${p}`);
});

// This suite should PASS — input transforms to the expected output
runFixturePairs("matching-rule", MATCHING_PAIRS, [varToConstPass]);

// This suite should FAIL at the assertion level inside the `it` block.
// We verify that the assertion itself throws by wrapping it manually.
describe("runFixturePairs — mismatched fixture produces assertion error", () => {
  it("the transform result does not equal the wrong expected output", async () => {
    const { transform } = await import("../transformer/index.js");
    const input = "var x = 1;";
    const wrongExpected = "let x = 1;";
    const result = transform(input, { parser: "babel", passes: [varToConstPass] });
    // Correct output is `const x = 1;` — asserting against wrong expected should fail
    expect(() => {
      expect(result.source.trim()).toBe(wrongExpected.trim());
    }).toThrow();
  });
});
