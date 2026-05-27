import type { RuleEntry } from "../rules/registry.js";

const OPERATOR_ASSIGNMENT_NEVER = ["error", "never"] as const;
const EQEQEQ_ALWAYS = ["error", "always"] as const;

const ESLINT_RULE_OVERRIDES: Record<string, unknown> = {
  "operator-assignment": OPERATOR_ASSIGNMENT_NEVER,
  "eqeqeq": EQEQEQ_ALWAYS,
};

function buildConfigEntry(
  rule: RuleEntry,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (rule.eslintRule === null) {
    return config;
  }
  const override = ESLINT_RULE_OVERRIDES[rule.eslintRule];
  let value: unknown;
  if (override !== undefined) {
    value = override;
  } else {
    value = "error";
  }
  return { ...config, [rule.eslintRule]: value };
}

export function generateEslintConfig(entries: RuleEntry[]): Record<string, unknown> {
  let config: Record<string, unknown> = {};

  for (const rule of entries) {
    config = buildConfigEntry(rule, config);
  }

  return config;
}
