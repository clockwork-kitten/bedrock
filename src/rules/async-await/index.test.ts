import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import { detectPromiseChains } from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/async-await",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectPromiseChains", function () {
  it("detects .then() chains and does not rewrite source", function () {
    const input = readFixture("then-chain.input.ts");
    const expected = readFixture("then-chain.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPromiseChains],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    const messages = result.violations.map(function (v) {
      return v.message;
    });
    expect(messages).toContain(
      "Use async/await with try/catch instead of .then()",
    );
    expect(result.violations[0].category).toBe("canonical");
  });

  it("detects .catch() chains and does not rewrite source", function () {
    const input = readFixture("catch-chain.input.ts");
    const expected = readFixture("catch-chain.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPromiseChains],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].message).toBe(
      "Use async/await with try/catch instead of .catch()",
    );
  });

  it("detects .finally() chains and does not rewrite source", function () {
    const input = readFixture("finally-chain.input.ts");
    const expected = readFixture("finally-chain.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPromiseChains],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].message).toBe(
      "Use try/catch/finally instead of .finally()",
    );
  });

  it("reports no violations for clean async/await code", function () {
    const input = readFixture("clean.input.ts");
    const expected = readFixture("clean.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPromiseChains],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations).toHaveLength(0);
  });

  it("reports line and column for violations", function () {
    const input = readFixture("catch-chain.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPromiseChains],
    });
    expect(result.violations[0].line).toBeGreaterThan(0);
    expect(result.violations[0].column).toBeGreaterThanOrEqual(0);
  });
});
