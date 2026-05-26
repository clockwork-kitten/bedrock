import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  forOfToIndexed,
  forInToIndexed,
  whileToFor,
  detectDoWhile,
  detectForEach,
  detectBreak,
  detectContinue,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/loops",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("forOfToIndexed", function () {
  it("rewrites for...of to indexed for loop", function () {
    const input = readFixture("for-of.input.ts");
    const expected = readFixture("for-of.output.ts");
    const result = transform(input, { parser: "ts", passes: [forOfToIndexed] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("forInToIndexed", function () {
  it("rewrites for...in to Object.keys + indexed for loop", function () {
    const input = readFixture("for-in.input.ts");
    const expected = readFixture("for-in.output.ts");
    const result = transform(input, { parser: "ts", passes: [forInToIndexed] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("whileToFor", function () {
  it("rewrites while to for(; cond;)", function () {
    const input = readFixture("while.input.ts");
    const expected = readFixture("while.output.ts");
    const result = transform(input, { parser: "ts", passes: [whileToFor] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("detectDoWhile", function () {
  it("flags do...while without modifying source", function () {
    const input = readFixture("do-while.input.ts");
    const expected = readFixture("do-while.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectDoWhile],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("do...while");
  });
});

describe("detectForEach", function () {
  it("flags forEach without modifying source", function () {
    const input = readFixture("foreach.input.ts");
    const expected = readFixture("foreach.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectForEach],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("forEach");
  });

  it("does not flag map, filter, or reduce", function () {
    const input = readFixture("map-filter-ok.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectForEach],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectBreak", function () {
  it("flags break without modifying source", function () {
    const input = readFixture("break.input.ts");
    const expected = readFixture("break.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBreak],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("break");
  });
});

describe("detectContinue", function () {
  it("flags continue without modifying source", function () {
    const input = readFixture("continue.input.ts");
    const expected = readFixture("continue.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectContinue],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("continue");
  });
});
