import { describe, it, expect } from "vitest";
import { reportFile, formatReport } from "./index.js";

const SOURCE_WITH_THEN = `
async function fetchData() {
  return fetch("/api").then(function(res) { return res.json(); });
}
`;

const SOURCE_WITH_CLASS = `
class Foo {
  bar() {
    return 1;
  }
}
`;

const SOURCE_WITH_NEW_PROMISE = `
function wrap(cb) {
  return new Promise(function(resolve, reject) {
    cb(resolve, reject);
  });
}
`;

const SOURCE_CLEAN = `
function add(a, b) {
  return a + b;
}
`;

describe("reportFile", function () {
  it("returns filePath in result", function () {
    const result = reportFile("src/foo.ts", SOURCE_CLEAN);
    expect(result.filePath).toBe("src/foo.ts");
  });

  it("returns empty violations for clean source", function () {
    const result = reportFile("src/clean.ts", SOURCE_CLEAN);
    expect(result.violations).toHaveLength(0);
  });

  it("isGrounded is true when no external-boundary violations", function () {
    const result = reportFile("src/clean.ts", SOURCE_CLEAN);
    expect(result.isGrounded).toBe(true);
  });

  it("detects .then() as canonical violation", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const thenViolations = result.violations.filter(function (v) {
      return v.ruleName === "async-await";
    });
    expect(thenViolations.length).toBeGreaterThan(0);
    expect(thenViolations[0].category).toBe("canonical");
  });

  it("includes filePath on each violation", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    for (const v of result.violations) {
      expect(v.filePath).toBe("src/foo.ts");
    }
  });

  it("includes ruleName on each violation", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    expect(result.violations[0].ruleName).toBeDefined();
  });

  it("isGrounded is false when external-boundary violations exist", function () {
    const result = reportFile("src/wrap.ts", SOURCE_WITH_NEW_PROMISE);
    const hasExternal = result.violations.some(function (v) {
      return v.category === "external-boundary";
    });
    expect(hasExternal).toBe(true);
    expect(result.isGrounded).toBe(false);
  });

  it("detects class declaration violation", function () {
    const result = reportFile("src/class.ts", SOURCE_WITH_CLASS);
    const classViolations = result.violations.filter(function (v) {
      return v.ruleName === "no-classes";
    });
    expect(classViolations.length).toBeGreaterThan(0);
  });
});

describe("formatReport", function () {
  it("includes file path in output", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const output = formatReport([result]);
    expect(output).toContain("src/foo.ts");
  });

  it("includes line numbers in output", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const output = formatReport([result]);
    expect(output).toMatch(/line \d+/);
  });

  it("includes violation category in output", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const output = formatReport([result]);
    expect(output).toContain("[canonical]");
  });

  it("includes rule name in output", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const output = formatReport([result]);
    expect(output).toContain("async-await");
  });

  it("includes summary line with counts", function () {
    const result = reportFile("src/foo.ts", SOURCE_WITH_THEN);
    const output = formatReport([result]);
    expect(output).toMatch(/\d+ file[s]?, \d+ violation[s]?/);
  });

  it("shows 0 violations for clean file", function () {
    const result = reportFile("src/clean.ts", SOURCE_CLEAN);
    const output = formatReport([result]);
    expect(output).toContain("0 violations");
  });

  it("includes external-boundary label for new Promise", function () {
    const result = reportFile("src/wrap.ts", SOURCE_WITH_NEW_PROMISE);
    const output = formatReport([result]);
    expect(output).toContain("[external-boundary]");
  });

  it("aggregates counts across multiple files", function () {
    const r1 = reportFile("src/a.ts", SOURCE_WITH_THEN);
    const r2 = reportFile("src/b.ts", SOURCE_WITH_CLASS);
    const output = formatReport([r1, r2]);
    expect(output).toContain("2 files");
  });
});
