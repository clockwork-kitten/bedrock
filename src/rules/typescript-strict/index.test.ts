import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  detectAnyType,
  detectTypeAssertion,
  detectNonNullAssertion,
  detectBareCatch,
  detectEnum,
  detectInterface,
  detectNamespace,
  detectMissingReturnType,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/typescript-strict",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectAnyType", function () {
  it("flags any type without modifying source", function () {
    const input = readFixture("any-type.input.ts");
    const expected = readFixture("any-type.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectAnyType],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("any is banned");
  });

  it("does not flag unknown", function () {
    const result = transform("const x: unknown = 1;", {
      parser: "ts",
      passes: [],
      violationPasses: [detectAnyType],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectTypeAssertion", function () {
  it("flags type assertion without modifying source", function () {
    const input = readFixture("type-assertion.input.ts");
    const expected = readFixture("type-assertion.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectTypeAssertion],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("type assertion");
  });

  it("does not flag code without as", function () {
    const result = transform("const x: number = 1;", {
      parser: "ts",
      passes: [],
      violationPasses: [detectTypeAssertion],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectNonNullAssertion", function () {
  it("flags non-null assertion without modifying source", function () {
    const input = readFixture("non-null-assertion.input.ts");
    const expected = readFixture("non-null-assertion.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectNonNullAssertion],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("non-null assertion");
  });

  it("does not flag normal property access", function () {
    const result = transform("const x = obj.name;", {
      parser: "ts",
      passes: [],
      violationPasses: [detectNonNullAssertion],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectBareCatch", function () {
  it("flags bare catch without modifying source", function () {
    const input = readFixture("bare-catch.input.ts");
    const expected = readFixture("bare-catch.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBareCatch],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("bare catch");
  });

  it("does not flag catch with unknown annotation", function () {
    const result = transform(
      "try { } catch (e: unknown) { console.error(e); }",
      {
        parser: "ts",
        passes: [],
        violationPasses: [detectBareCatch],
      },
    );
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectEnum", function () {
  it("flags enum without modifying source", function () {
    const input = readFixture("enum.input.ts");
    const expected = readFixture("enum.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectEnum],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("enum is banned");
  });

  it("does not flag as const object", function () {
    const result = transform(
      "const Direction = { Up: 'Up', Down: 'Down' } as const;",
      {
        parser: "ts",
        passes: [],
        violationPasses: [detectEnum],
      },
    );
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectInterface", function () {
  it("flags interface without modifying source", function () {
    const input = readFixture("interface.input.ts");
    const expected = readFixture("interface.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectInterface],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("interface is banned");
  });

  it("does not flag type alias", function () {
    const result = transform("type User = { name: string; age: number };", {
      parser: "ts",
      passes: [],
      violationPasses: [detectInterface],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectNamespace", function () {
  it("flags namespace without modifying source", function () {
    const input = readFixture("namespace.input.ts");
    const expected = readFixture("namespace.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectNamespace],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("namespace/module keyword is banned");
  });
});

describe("detectMissingReturnType", function () {
  it("flags exported function missing return type without modifying source", function () {
    const input = readFixture("missing-return-type.input.ts");
    const expected = readFixture("missing-return-type.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectMissingReturnType],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("type-level");
    expect(result.violations[0].message).toContain("missing an explicit return type");
  });

  it("does not flag exported function with return type", function () {
    const result = transform(
      "export function add(a: number, b: number): number { return a + b; }",
      {
        parser: "ts",
        passes: [],
        violationPasses: [detectMissingReturnType],
      },
    );
    expect(result.violations).toHaveLength(0);
  });

  it("does not flag non-exported function missing return type", function () {
    const result = transform(
      "function add(a: number, b: number) { return a + b; }",
      {
        parser: "ts",
        passes: [],
        violationPasses: [detectMissingReturnType],
      },
    );
    expect(result.violations).toHaveLength(0);
  });
});
