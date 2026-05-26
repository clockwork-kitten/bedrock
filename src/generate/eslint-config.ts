import type { RuleEntry } from "../rules/registry.js";

const OPERATOR_ASSIGNMENT_NEVER = ["error", "never"] as const;

const ESLINT_RULE_OVERRIDES: Record<string, unknown> = {
  "operator-assignment": OPERATOR_ASSIGNMENT_NEVER,
};

export function generateEslintConfig(entries: RuleEntry[]): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  for (const rule of entries) {
    if (rule.eslintRule === null) {
      continue;
    }
    const override = ESLINT_RULE_OVERRIDES[rule.eslintRule];
    config[rule.eslintRule] = override !== undefined ? override : "error";
  }

  return config;
}
