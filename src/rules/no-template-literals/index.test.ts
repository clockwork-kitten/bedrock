import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import { rewriteTemplateLiterals, detectTaggedTemplateLiterals } from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/no-template-literals",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("rewriteTemplateLiterals", function () {
  it("rewrites simple interpolation to string concatenation", function () {
    const input = readFixture("simple-interpolation.input.ts");
    const expected = readFixture("simple-interpolation.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [rewriteTemplateLiterals],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites multiple interpolations to chained concatenation", function () {
    const input = readFixture("multiple-interpolations.input.ts");
    const expected = readFixture("multiple-interpolations.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [rewriteTemplateLiterals],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites plain template literal (no interpolation) to string", function () {
    const input = readFixture("no-interpolation.input.ts");
    const expected = readFixture("no-interpolation.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [rewriteTemplateLiterals],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("does not rewrite tagged template literals", function () {
    const input = readFixture("tagged-template.input.ts");
    const expected = readFixture("tagged-template.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [rewriteTemplateLiterals],
    });
    expect(result.source.trim()).toBe(expected.trim());
  });
});

describe("detectTaggedTemplateLiterals", function () {
  it("flags tagged template literals as violations without modifying source", function () {
    const input = readFixture("tagged-template.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectTaggedTemplateLiterals],
    });
    expect(result.source.trim()).toBe(input.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("Tagged template");
  });

  it("does not flag plain template literals", function () {
    const input = readFixture("simple-interpolation.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectTaggedTemplateLiterals],
    });
    expect(result.violations).toHaveLength(0);
  });
});
