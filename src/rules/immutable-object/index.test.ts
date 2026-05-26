import { describe, it, expect } from "vitest";
import {
  detectPropertyAssign,
  detectDeleteProp,
  transformHasOwnProperty,
} from "./index.js";
import { transform } from "../../transformer/index.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/immutable-object",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectPropertyAssign", function () {
  it("flags obj.foo = x as canonical violation", function () {
    const input = readFixture("property-assign.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPropertyAssign],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("initial construction");
  });

  it("does not modify source", function () {
    const input = readFixture("property-assign.input.ts");
    const expected = readFixture("property-assign.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPropertyAssign],
    });
    expect(result.source.trim()).toBe(expected.trim());
  });

  it("does not flag computed access (array[i])", function () {
    const input = "const arr = [1, 2]; arr[0] = 99;";
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectPropertyAssign],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("detectDeleteProp", function () {
  it("flags delete obj.foo as canonical violation", function () {
    const input = readFixture("delete-prop.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectDeleteProp],
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("delete");
  });

  it("does not modify source", function () {
    const input = readFixture("delete-prop.input.ts");
    const expected = readFixture("delete-prop.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectDeleteProp],
    });
    expect(result.source.trim()).toBe(expected.trim());
  });

  it("does not flag delete on array index expressions", function () {
    const input = "const arr = [1, 2, 3]; delete arr[1];";
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectDeleteProp],
    });
    expect(result.violations).toHaveLength(0);
  });
});

describe("transformHasOwnProperty", function () {
  it("rewrites obj.hasOwnProperty(key) to Object.hasOwn(obj, key)", function () {
    const input = readFixture("has-own-property.input.ts");
    const expected = readFixture("has-own-property.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [transformHasOwnProperty],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.changed).toBe(true);
  });
});
