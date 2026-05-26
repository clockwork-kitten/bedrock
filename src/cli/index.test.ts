import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "./args.js";
import { resolvePatterns, runFix, runReport, run } from "./runner.js";

// ── parseArgs tests ───────────────────────────────────────────────────────

describe("parseArgs", function () {
  it("defaults to report when no flags given", function () {
    const result = parseArgs(["node", "bedrock", "src/foo.ts"]);
    expect(result.fix).toBe(false);
    expect(result.report).toBe(true);
    expect(result.patterns).toEqual(["src/foo.ts"]);
  });

  it("parses --fix flag", function () {
    const result = parseArgs(["node", "bedrock", "src/**/*.ts", "--fix"]);
    expect(result.fix).toBe(true);
    expect(result.report).toBe(false);
    expect(result.patterns).toEqual(["src/**/*.ts"]);
  });

  it("parses --report flag", function () {
    const result = parseArgs(["node", "bedrock", "src/**/*.ts", "--report"]);
    expect(result.fix).toBe(false);
    expect(result.report).toBe(true);
  });

  it("parses --fix and --report together", function () {
    const result = parseArgs(["node", "bedrock", "src/**/*.ts", "--fix", "--report"]);
    expect(result.fix).toBe(true);
    expect(result.report).toBe(true);
  });

  it("handles multiple patterns", function () {
    const result = parseArgs(["node", "bedrock", "src/a.ts", "src/b.ts"]);
    expect(result.patterns).toEqual(["src/a.ts", "src/b.ts"]);
  });
});

// ── Fixtures ──────────────────────────────────────────────────────────────

const TEMP_DIR = "/var/folders/8g/c3q8m_q95klbx3gkzdxylk7c0000gn/T/opencode/cli-test";

// var x = 1 — transformer auto-fixes to const
const VAR_SOURCE = `var x = 1;\n`;
// const x = 1 — clean, no violations
const CLEAN_SOURCE = `const x = 1;\n`;
// forEach — reporter violation (not auto-fixable)
const FOREACH_SOURCE = `const arr = [1, 2, 3];\narr.forEach(function(x) { console.log(x); });\n`;
// arrow function — transformer auto-fixes
const ARROW_SOURCE = `const fn = (x) => x + 1;\n`;

// ── resolvePatterns tests ─────────────────────────────────────────────────

describe("resolvePatterns", function () {
  beforeEach(function () {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, "clean.ts"), CLEAN_SOURCE);
    writeFileSync(join(TEMP_DIR, "var.ts"), VAR_SOURCE);
  });

  afterEach(function () {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it("resolves absolute file paths", function () {
    const files = resolvePatterns([join(TEMP_DIR, "clean.ts")]);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("clean.ts");
  });

  it("resolves glob patterns", function () {
    const files = resolvePatterns([join(TEMP_DIR, "*.ts")]);
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty array when no files match", function () {
    const files = resolvePatterns([join(TEMP_DIR, "nonexistent.ts")]);
    expect(files).toHaveLength(0);
  });
});

// ── runFix tests ──────────────────────────────────────────────────────────

describe("runFix", function () {
  beforeEach(function () {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, "var.ts"), VAR_SOURCE);
    writeFileSync(join(TEMP_DIR, "clean.ts"), CLEAN_SOURCE);
    writeFileSync(join(TEMP_DIR, "arrow.ts"), ARROW_SOURCE);
  });

  afterEach(function () {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it("transforms var files and reports changed count", function () {
    const files = [join(TEMP_DIR, "var.ts")];
    const result = runFix(files);
    expect(result.changed).toHaveLength(1);
    expect(result.output).toContain("Fixed 1 file(s)");
  });

  it("does not change already-clean files", function () {
    const files = [join(TEMP_DIR, "clean.ts")];
    const result = runFix(files);
    expect(result.changed).toHaveLength(0);
    expect(result.output).toContain("No files changed");
  });

  it("transforms arrow functions", function () {
    const files = [join(TEMP_DIR, "arrow.ts")];
    const result = runFix(files);
    expect(result.changed).toHaveLength(1);
  });
});

// ── runReport tests ───────────────────────────────────────────────────────

describe("runReport", function () {
  beforeEach(function () {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, "foreach.ts"), FOREACH_SOURCE);
    writeFileSync(join(TEMP_DIR, "clean.ts"), CLEAN_SOURCE);
  });

  afterEach(function () {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it("returns exitCode 1 when there are violations", function () {
    const files = [join(TEMP_DIR, "foreach.ts")];
    const result = runReport(files);
    expect(result.exitCode).toBe(1);
  });

  it("returns exitCode 0 when clean", function () {
    const files = [join(TEMP_DIR, "clean.ts")];
    const result = runReport(files);
    expect(result.exitCode).toBe(0);
  });

  it("includes grounded summary in output", function () {
    const files = [join(TEMP_DIR, "clean.ts")];
    const result = runReport(files);
    expect(result.output).toContain("grounded");
  });
});

// ── run integration tests ─────────────────────────────────────────────────

describe("run (integration)", function () {
  beforeEach(function () {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, "foreach.ts"), FOREACH_SOURCE);
    writeFileSync(join(TEMP_DIR, "var.ts"), VAR_SOURCE);
    writeFileSync(join(TEMP_DIR, "clean.ts"), CLEAN_SOURCE);
  });

  afterEach(function () {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it("reports violations and exits with code 1", function () {
    const result = run([join(TEMP_DIR, "foreach.ts")], false, true);
    expect(result.exitCode).toBe(1);
    expect(result.output).toBeTruthy();
  });

  it("fixes var and returns exit code 0", function () {
    const result = run([join(TEMP_DIR, "var.ts")], true, false);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Fixed");
  });

  it("returns no match message when patterns match nothing", function () {
    const result = run([join(TEMP_DIR, "*.xyz")], false, true);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("No files matched");
  });

  it("fix then report: fixes var and reports remaining violations", function () {
    const result = run([join(TEMP_DIR, "foreach.ts"), join(TEMP_DIR, "var.ts")], true, true);
    expect(result.output).toContain("Fixed");
    expect(result.output).toContain("grounded");
  });
});
