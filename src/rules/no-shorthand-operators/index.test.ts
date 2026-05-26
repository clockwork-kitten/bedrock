import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  compoundAssignToExplicit,
  updateExpressionToExplicit,
  detectUpdateExpressionInExpression,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/no-shorthand-operators",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("updateExpressionToExplicit", function () {
  it("rewrites x++ to x = x + 1", function () {
    const input = readFixture("increment.input.ts");
    const expected = readFixture("increment.output.ts");
    const result = transform(input, { parser: "ts", passes: [updateExpressionToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites x-- to x = x - 1", function () {
    const input = readFixture("decrement.input.ts");
    const expected = readFixture("decrement.output.ts");
    const result = transform(input, { parser: "ts", passes: [updateExpressionToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites ++x to x = x + 1", function () {
    const input = readFixture("prefix-increment.input.ts");
    const expected = readFixture("prefix-increment.output.ts");
    const result = transform(input, { parser: "ts", passes: [updateExpressionToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("compoundAssignToExplicit", function () {
  it("rewrites x += n to x = x + n", function () {
    const input = readFixture("plus-assign.input.ts");
    const expected = readFixture("plus-assign.output.ts");
    const result = transform(input, { parser: "ts", passes: [compoundAssignToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites x -= n to x = x - n", function () {
    const input = readFixture("minus-assign.input.ts");
    const expected = readFixture("minus-assign.output.ts");
    const result = transform(input, { parser: "ts", passes: [compoundAssignToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites x *= n to x = x * n", function () {
    const input = readFixture("multiply-assign.input.ts");
    const expected = readFixture("multiply-assign.output.ts");
    const result = transform(input, { parser: "ts", passes: [compoundAssignToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("rewrites x /= n to x = x / n", function () {
    const input = readFixture("divide-assign.input.ts");
    const expected = readFixture("divide-assign.output.ts");
    const result = transform(input, { parser: "ts", passes: [compoundAssignToExplicit] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("detectUpdateExpressionInExpression", function () {
  it("flags x++ used as expression (return value used)", function () {
    const input = "let x = 0; const y = x++;";
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectUpdateExpressionInExpression],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("x++");
  });

  it("does not flag standalone x++ (ExpressionStatement)", function () {
    const input = "let x = 0;\nx++;\n";
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectUpdateExpressionInExpression],
    });
    expect(result.violations).toHaveLength(0);
  });
});
