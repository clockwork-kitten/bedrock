import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  arrowToFunctionExpression,
  detectDefaultParams,
  detectAsyncNoAwait,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/no-arrow-functions",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("arrowToFunctionExpression", function () {
  it("rewrites expression-body arrow to function expression with return", function () {
    const input = readFixture("arrow-expression-body.input.ts");
    const expected = readFixture("arrow-expression-body.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites block-body arrow to function expression", function () {
    const input = readFixture("arrow-block-body.input.ts");
    const expected = readFixture("arrow-block-body.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("infers name from variable declarator for named arrow", function () {
    const input = readFixture("named-arrow.input.ts");
    const expected = readFixture("named-arrow.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("preserves async modifier on async arrow functions", function () {
    const input = readFixture("async-arrow.input.ts");
    const expected = readFixture("async-arrow.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites inline callback arrows in .map()", function () {
    const input = readFixture("inline-callback.input.ts");
    const expected = readFixture("inline-callback.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("detectDefaultParams", function () {
  it("flags default parameters without modifying source", function () {
    const input = readFixture("default-param.input.ts");
    const expected = readFixture("default-param.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectDefaultParams],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("Default parameters");
  });
});

describe("detectAsyncNoAwait", function () {
  it("flags async function with no await without modifying source", function () {
    const input = readFixture("async-no-await.input.ts");
    const expected = readFixture("async-no-await.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectAsyncNoAwait],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("async");
  });

  it("does not flag async function that contains await", function () {
    const input = readFixture("async-arrow.input.ts");
    // transform + rewrite arrows first so we get FunctionExpression/FunctionDeclaration
    const result = transform(input, {
      parser: "ts",
      passes: [arrowToFunctionExpression],
      violationPasses: [detectAsyncNoAwait],
    });
    expect(result.violations).toHaveLength(0);
  });
});
