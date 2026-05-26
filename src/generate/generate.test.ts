import { describe, it, expect } from "vitest";
import { rules } from "../rules/registry.js";
import { generateRulesMd } from "./rules-md.js";
import { generateEslintConfig } from "./eslint-config.js";

describe("rules registry", function () {
  it("contains at least 20 entries", function () {
    expect(rules.length).toBeGreaterThanOrEqual(20);
  });

  it("all entries have required fields", function () {
    for (const rule of rules) {
      expect(typeof rule.id).toBe("string");
      expect(typeof rule.description).toBe("string");
      expect(["explicitness", "immutability", "both"]).toContain(rule.principle);
      expect(["canonical", "type-level", "external-boundary"]).toContain(rule.category);
      expect(typeof rule.autoFixable).toBe("boolean");
      expect(typeof rule.banned).toBe("string");
      expect(typeof rule.canonical).toBe("string");
      expect(rule.eslintRule === null || typeof rule.eslintRule === "string").toBe(true);
    }
  });
});

describe("generateRulesMd", function () {
  const md = generateRulesMd(rules);

  it("returns a string", function () {
    expect(typeof md).toBe("string");
  });

  it("contains the main heading", function () {
    expect(md).toContain("# Bedrock.js — Rules Reference");
  });

  it("contains section headings", function () {
    expect(md).toContain("## Variables");
    expect(md).toContain("## Equality");
    expect(md).toContain("## Functions");
    expect(md).toContain("## Loops and Iteration");
    expect(md).toContain("## Array Mutation");
    expect(md).toContain("## Object Mutation");
    expect(md).toContain("## Async");
    expect(md).toContain("## Control Flow");
    expect(md).toContain("## Shorthand Operators");
    expect(md).toContain("## Classes");
    expect(md).toContain("## Template Literals");
    expect(md).toContain("## TypeScript");
  });

  it("contains the legend", function () {
    expect(md).toContain("## Legend");
    expect(md).toContain("canonical");
    expect(md).toContain("type-level");
    expect(md).toContain("external-boundary");
  });

  it("contains principled exceptions section", function () {
    expect(md).toContain("## Principled Exceptions");
    expect(md).toContain("array.map()");
    expect(md).toContain("Early `return`");
  });

  it("contains known rule entries", function () {
    expect(md).toContain("var x, let x when never reassigned");
    expect(md).toContain("== and !=");
    expect(md).toContain("`hello ${name}`");
  });

  it("marks auto-fixable rules correctly", function () {
    expect(md).toContain("✅ yes");
  });
});

describe("generateEslintConfig", function () {
  const config = generateEslintConfig(rules);

  it("returns an object", function () {
    expect(typeof config).toBe("object");
    expect(config).not.toBeNull();
  });

  it("includes prefer-const rule", function () {
    expect(config["prefer-const"]).toBe("error");
  });

  it("includes no-var rule", function () {
    expect(config["no-var"]).toBe("error");
  });

  it("includes eqeqeq rule", function () {
    expect(config["eqeqeq"]).toBe("error");
  });

  it("includes no-plusplus rule", function () {
    expect(config["no-plusplus"]).toBe("error");
  });

  it("includes operator-assignment rule set to never", function () {
    expect(config["operator-assignment"]).toEqual(["error", "never"]);
  });

  it("includes no-class-assign rule", function () {
    expect(config["no-class-assign"]).toBe("error");
  });

  it("includes no-template-curly-in-string rule", function () {
    expect(config["no-template-curly-in-string"]).toBe("error");
  });

  it("does not include keys with null eslintRule", function () {
    // Rules like no-arrow-functions have no ESLint equivalent and should be absent
    expect(config["no-arrow-functions"]).toBeUndefined();
    expect(config["no-ternary"]).toBeUndefined();
  });
});
