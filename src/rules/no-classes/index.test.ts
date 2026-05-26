import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  detectClassDeclaration,
  detectClassExpression,
  detectThisExpression,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/no-classes",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectClassDeclaration", function () {
  it("flags class declaration without modifying source", function () {
    const input = readFixture("class-declaration.input.ts");
    const expected = readFixture("class-declaration.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectClassDeclaration],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("class syntax is banned");
  });
});

describe("detectClassExpression", function () {
  it("flags class expression without modifying source", function () {
    const input = readFixture("class-expression.input.ts");
    const expected = readFixture("class-expression.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectClassExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("class syntax is banned");
  });
});

describe("detectThisExpression", function () {
  it("flags this expression without modifying source", function () {
    const input = readFixture("this-expression.input.ts");
    const expected = readFixture("this-expression.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectThisExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("this is banned");
  });

  it("does not flag code without this", function () {
    const input = "function add(a: number, b: number): number { return a + b; }";
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectThisExpression],
    });
    expect(result.violations).toHaveLength(0);
  });
});
