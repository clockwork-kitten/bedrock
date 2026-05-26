import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { rules } from "../src/rules/registry.js";
import { generateRulesMd } from "../src/generate/rules-md.js";
import { generateEslintConfig } from "../src/generate/eslint-config.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const RULES_MD_PATH = join(REPO_ROOT, "RULES.md");
const ESLINT_CONFIG_PATH = join(REPO_ROOT, "eslint-config-bedrock.json");

const rulesMd = generateRulesMd(rules);
writeFileSync(RULES_MD_PATH, rulesMd, "utf8");

const eslintConfig = generateEslintConfig(rules);
writeFileSync(ESLINT_CONFIG_PATH, JSON.stringify(eslintConfig, null, 2) + "\n", "utf8");

console.log("Generated RULES.md and eslint-config-bedrock.json");
