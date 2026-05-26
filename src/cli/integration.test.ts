import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// ── helpers ───────────────────────────────────────────────────────────────

const CLI_ENTRY = join(import.meta.dirname, "index.ts");

type SpawnResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

function runCli(args: string[]): SpawnResult {
  const result = spawnSync("bun", [CLI_ENTRY, ...args], {
    encoding: "utf-8",
    timeout: 30_000,
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}

function makeTempDir(): string {
  const dir = join(tmpdir(), "bedrock-integration-" + Math.random().toString(36).slice(2));
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeTemp(dir: string, name: string, content: string): string {
  const filePath = join(dir, name);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

function readTemp(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

// ── test sources ──────────────────────────────────────────────────────────

const FOREACH_SOURCE = `const arr = [1, 2, 3];\narr.forEach(function(x) { console.log(x); });\n`;
const CLEAN_SOURCE = `const x = 1;\n`;
const VAR_AND_COMPOUND = `var x = 1;\nx += 5;\n`;
const VAR_AND_THEN = `var x = 1;\nfetch("http://example.com").then(function(r) { return r.json(); });\n`;

// ── integration tests ─────────────────────────────────────────────────────

describe("integration", function () {
  let tempDir: string;

  beforeEach(function () {
    tempDir = makeTempDir();
  });

  afterEach(function () {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("report mode — violations found: exits 1, stdout mentions canonical and file path", function () {
    const filePath = writeTemp(tempDir, "violations.ts", FOREACH_SOURCE);
    const result = runCli([filePath, "--report"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("canonical");
    expect(result.stdout).toContain(filePath);
  });

  it("report mode — clean file: exits 0, stdout mentions 0 violations or grounded", function () {
    const filePath = writeTemp(tempDir, "clean.ts", CLEAN_SOURCE);
    const result = runCli([filePath, "--report"]);

    expect(result.exitCode).toBe(0);
    // Either "0 violation" or "grounded" indicates a clean run
    const mentionsClean =
      result.stdout.includes("0 violation") ||
      result.stdout.includes("grounded") ||
      result.stdout.includes("No violations");
    expect(mentionsClean).toBe(true);
  });

  it("fix mode — transforms var and compound assignment, writes canonical file", function () {
    const filePath = writeTemp(tempDir, "fix-me.ts", VAR_AND_COMPOUND);
    const result = runCli([filePath, "--fix"]);

    expect(result.exitCode).toBe(0);

    const fixed = readTemp(filePath);
    expect(fixed).toContain("let x = 1");
    expect(fixed).toContain("x = x + 5");
    expect(fixed).not.toContain("var ");
    expect(fixed).not.toContain("x += ");
  });

  it("fix + report mode — fixes var, still reports .then() violation", function () {
    const filePath = writeTemp(tempDir, "mixed.ts", VAR_AND_THEN);
    const result = runCli([filePath, "--fix", "--report"]);

    // File should be fixed
    const fixed = readTemp(filePath);
    expect(fixed).not.toContain("var ");

    // .then() is external-boundary or canonical — should still appear in report
    expect(result.stdout).toContain(filePath);
    // Exit code 1 because .then() violation remains
    expect(result.exitCode).toBe(1);
  });

  it("glob input — processes multiple files in temp dir", function () {
    const fileA = writeTemp(tempDir, "a.ts", FOREACH_SOURCE);
    writeTemp(tempDir, "b.ts", CLEAN_SOURCE);
    const globPattern = join(tempDir, "*.ts");

    const result = runCli([globPattern, "--report"]);

    // Both files are processed — summary reflects 2 files
    expect(result.stdout).toMatch(/2 files?/);
    // The violating file path appears in the report
    expect(result.stdout).toContain(fileA);
  });

  it("no match — graceful output and exit code 0", function () {
    const globPattern = join(tempDir, "*.xyz");
    const result = runCli([globPattern, "--report"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toMatch(/no files matched/i);
  });

  it("grounded file — clean file with no external-boundary violations shows grounded in report", function () {
    const filePath = writeTemp(tempDir, "grounded.ts", CLEAN_SOURCE);
    const result = runCli([filePath, "--report"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("grounded");
  });
});
