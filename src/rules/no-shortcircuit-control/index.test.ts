import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  detectTernary,
  detectSwitch,
  detectLogicalOrDefault,
  detectLogicalAndExec,
  detectNullishCoalescing,
  detectOptionalChain,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/no-shortcircuit-control",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectTernary", function () {
  it("flags ternary expression without modifying source", function () {
    const input = readFixture("ternary.input.ts");
    const expected = readFixture("ternary.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectTernary],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("ternary");
  });
});

describe("detectSwitch", function () {
  it("flags switch statement without modifying source", function () {
    const input = readFixture("switch.input.ts");
    const expected = readFixture("switch.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectSwitch],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("switch");
  });
});

describe("detectLogicalOrDefault", function () {
  it("flags || used for default value without modifying source", function () {
    const input = readFixture("logical-or-default.input.ts");
    const expected = readFixture("logical-or-default.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectLogicalOrDefault],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("||");
  });
});

describe("detectLogicalAndExec", function () {
  it("flags && used for conditional execution without modifying source", function () {
    const input = readFixture("logical-and-exec.input.ts");
    const expected = readFixture("logical-and-exec.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectLogicalAndExec],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("&&");
  });
});

describe("detectNullishCoalescing", function () {
  it("flags ?? without modifying source", function () {
    const input = readFixture("nullish-coalescing.input.ts");
    const expected = readFixture("nullish-coalescing.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectNullishCoalescing],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("??");
  });
});

describe("detectOptionalChain", function () {
  it("flags ?. without modifying source", function () {
    const input = readFixture("optional-chain.input.ts");
    const expected = readFixture("optional-chain.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectOptionalChain],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("?.");
  });
});
