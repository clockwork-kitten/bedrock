import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { transform } from "../../transformer/index.js";
import {
  detectBannedPromiseMethods,
  detectNewPromise,
  detectBareAwait,
} from "./index.js";

const FIXTURES_DIR = new URL(
  "../../__fixtures__/promise-rules",
  import.meta.url,
).pathname;

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("detectBannedPromiseMethods", function () {
  it("flags Promise.race() with canonical violation", function () {
    const input = readFixture("promise-race.input.ts");
    const expected = readFixture("promise-race.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBannedPromiseMethods],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("Promise.allSettled()");
    expect(result.violations[0].message).toContain("winner selection");
  });

  it("flags Promise.any() with canonical violation", function () {
    const input = readFixture("promise-any.input.ts");
    const expected = readFixture("promise-any.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBannedPromiseMethods],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("Promise.allSettled()");
    expect(result.violations[0].message).toContain("first-success");
  });

  it("does not flag Promise.all()", function () {
    const input = readFixture("promise-all-ok.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBannedPromiseMethods],
    });
    expect(result.violations).toHaveLength(0);
  });

  it("does not flag Promise.allSettled()", function () {
    const input = readFixture("promise-allsettled-ok.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBannedPromiseMethods],
    });
    expect(result.violations).toHaveLength(0);
  });

  it("reports line and column for violations", function () {
    const input = readFixture("promise-race.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBannedPromiseMethods],
    });
    expect(result.violations[0].line).toBeGreaterThan(0);
    expect(result.violations[0].column).toBeGreaterThanOrEqual(0);
  });
});

describe("detectNewPromise", function () {
  it("flags new Promise() with external-boundary violation", function () {
    const input = readFixture("new-promise.input.ts");
    const expected = readFixture("new-promise.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectNewPromise],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].category).toBe("external-boundary");
    expect(result.violations[0].message).toContain("async");
    expect(result.violations[0].message).toContain("callback");
  });
});

describe("detectBareAwait", function () {
  it("flags await outside try/catch with canonical violation", function () {
    const input = readFixture("bare-await.input.ts");
    const expected = readFixture("bare-await.output.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBareAwait],
    });
    expect(result.source.trim()).toBe(expected.trim());
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].category).toBe("canonical");
    expect(result.violations[0].message).toContain("try/catch");
  });

  it("does not flag await inside try/catch", function () {
    const input = readFixture("await-in-trycatch-ok.input.ts");
    const result = transform(input, {
      parser: "ts",
      passes: [],
      violationPasses: [detectBareAwait],
    });
    expect(result.violations).toHaveLength(0);
  });
});
