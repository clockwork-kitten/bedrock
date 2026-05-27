import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { rules } from "../src/rules/registry.js";
import { generateRulesMd } from "../src/generate/rules-md.js";
import { generateEslintConfig } from "../src/generate/eslint-config.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const RULES_MD_PATH = join(REPO_ROOT, "RULES.md");
const ESLINT_CONFIG_PATH = join(REPO_ROOT, "eslint-config-bedrock.json");
const PACKAGE_INDEX_PATH = join(
  REPO_ROOT,
  "packages/eslint-config-bedrock/index.js",
);

const INTENTIONALLY_OMITTED_RULES = new Set([
  // no-template-curly-in-string flags interpolation inside regular strings,
  // which is the inverse of what Bedrock bans (template literals themselves).
  "no-template-curly-in-string",
]);

const OPERATOR_ASSIGNMENT_RULE = "operator-assignment";
const EQEQEQ_RULE = "eqeqeq";

function buildRulesObject(config: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [ruleName, value] of Object.entries(config)) {
    if (INTENTIONALLY_OMITTED_RULES.has(ruleName)) {
      continue;
    }
    const serialized = JSON.stringify(value);
    lines.push(`      ${JSON.stringify(ruleName)}: ${serialized},`);
  }
  return lines.join("\n");
}

function syncPackageIndex(config: Record<string, unknown>): void {
  const existing = readFileSync(PACKAGE_INDEX_PATH, "utf8");
  const rulesBlock = buildRulesObject(config);
  const omittedNote =
    "      // no-template-curly-in-string is intentionally omitted —\n" +
    "      // it flags interpolation inside regular strings, not template literals,\n" +
    "      // which is the inverse of what Bedrock bans";
  const updated = existing.replace(
    /(\{\n\s+rules: \{)[^}]*(\/\/ no-template-curly[^\n]*\n[^\n]*\n[^\n]*\n\s*\},)/s,
    (_match, _open, _close) => {
      return `{\n    rules: {\n${rulesBlock}\n${omittedNote}\n    },`;
    },
  );
  writeFileSync(PACKAGE_INDEX_PATH, updated, "utf8");
}

const rulesMd = generateRulesMd(rules);
writeFileSync(RULES_MD_PATH, rulesMd, "utf8");

const eslintConfig = generateEslintConfig(rules);
writeFileSync(ESLINT_CONFIG_PATH, JSON.stringify(eslintConfig, null, 2) + "\n", "utf8");

syncPackageIndex(eslintConfig);

console.log(
  "Generated RULES.md, eslint-config-bedrock.json, and synced packages/eslint-config-bedrock/index.js",
);
