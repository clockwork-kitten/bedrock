import { describe, it, expect } from "vitest";
import {
  transformPush,
  transformUnshift,
  transformSort,
  transformSparseArrays,
  detectSortNoComparator,
  detectPop,
  detectShift,
  detectSplice,
  detectIndexedAssign,
  detectArrayConstructor,
} from "./index.js";
import { transform } from "../../transformer/index.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/immutable-array",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("transformPush", function () {
  it("rewrites single-arg push to spread", function () {
    const input = readFixture("push.input.ts");
    const expected = readFixture("push.output.ts");
    const result = transform(input, { parser: "ts", passes: [transformPush] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("transformUnshift", function () {
  it("rewrites single-arg unshift to spread", function () {
    const input = readFixture("unshift.input.ts");
    const expected = readFixture("unshift.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [transformUnshift],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("transformSort", function () {
  it("wraps sort(comparator) with spread copy", function () {
    const input = readFixture("sort-with-comparator.input.ts");
    const expected = readFixture("sort-with-comparator.output.ts");
    const result = transform(input, { parser: "ts", passes: [transformSort] });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });

  it("does not modify sort() without comparator", function () {
    const input = readFixture("sort-no-comparator.input.ts");
    const result = transform(input, { parser: "ts", passes: [transformSort] });
    expect(result.changed).toBe(false);
  });
});

describe("transformSparseArrays", function () {
  it("replaces holes with undefined", function () {
    const input = readFixture("sparse-array.input.ts");
    const expected = readFixture("sparse-array.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [transformSparseArrays],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});

describe("detectSortNoComparator", function () {
  it("flags sort() without comparator as canonical violation", function () {
    const input = readFixture("sort-no-comparator.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectSortNoComparator],
    });
    expect(result.source.trim()).toBe(input.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("comparator");
  });

  it("does not flag sort(comparator)", function () {
    const input = readFixture("sort-with-comparator.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectSortNoComparator],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectPop", function () {
  it("flags pop() as canonical violation", function () {
    const input = readFixture("pop.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPop],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("pop");
  });
});

describe("detectShift", function () {
  it("flags shift() as canonical violation", function () {
    const input = readFixture("shift.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectShift],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("shift");
  });
});

describe("detectSplice", function () {
  it("flags splice() as canonical violation", function () {
    const input = readFixture("splice.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectSplice],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("splice");
  });
});

describe("detectIndexedAssign", function () {
  it("flags array[i] = x as canonical violation", function () {
    const input = readFixture("indexed-assign.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectIndexedAssign],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("array[i]");
  });
});

describe("detectArrayConstructor", function () {
  it("flags Array(n) and new Array(n) as canonical violations", function () {
    const input = readFixture("array-constructor.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectArrayConstructor],
    });
    expect(result.violations.length).toBe(2);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("Array(n)");
  });
});
