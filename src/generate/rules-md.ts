import type { RuleEntry } from "../rules/registry.js";

const SECTION_ORDER = [
  "Variables",
  "Equality",
  "Functions",
  "Loops and Iteration",
  "Array Mutation",
  "Object Mutation",
  "Async",
  "Control Flow",
  "Shorthand Operators",
  "Classes",
  "Template Literals",
  "TypeScript",
  "Array — Additional",
  "Object — Additional",
  "Promise — Additional",
  "Spread",
  "Destructuring",
] as const;

type SectionName = (typeof SECTION_ORDER)[number];

const RULE_ID_TO_SECTION: Record<string, SectionName> = {
  "var-to-const": "Variables",
  "no-var": "Variables",
  equality: "Equality",
  "no-arrow-functions": "Functions",
  "no-default-parameters": "Functions",
  "no-async-without-await": "Functions",
  "no-for-each": "Loops and Iteration",
  "no-for-of": "Loops and Iteration",
  "no-for-in": "Loops and Iteration",
  "no-while": "Loops and Iteration",
  "no-do-while": "Loops and Iteration",
  "no-labeled-statements": "Loops and Iteration",
  "no-break": "Loops and Iteration",
  "no-continue": "Loops and Iteration",
  "no-array-push": "Array Mutation",
  "no-array-unshift": "Array Mutation",
  "no-array-pop": "Array Mutation",
  "no-array-shift": "Array Mutation",
  "no-array-splice": "Array Mutation",
  "no-array-index-assign": "Array Mutation",
  "no-property-assign": "Object Mutation",
  "no-delete": "Object Mutation",
  "no-promise-then": "Async",
  "no-ternary": "Control Flow",
  "no-switch": "Control Flow",
  "no-logical-or-default": "Control Flow",
  "no-logical-and-execution": "Control Flow",
  "no-nullish-coalescing": "Control Flow",
  "no-optional-chaining": "Control Flow",
  "no-increment": "Shorthand Operators",
  "no-shorthand-operators": "Shorthand Operators",
  "no-classes": "Classes",
  "no-this": "Classes",
  "no-template-literals": "Template Literals",
  "no-any": "TypeScript",
  "no-type-assertion": "TypeScript",
  "no-non-null-assertion": "TypeScript",
  "no-bare-catch": "TypeScript",
  "no-enum": "TypeScript",
  "no-interface": "TypeScript",
  "no-namespace": "TypeScript",
  "require-return-type": "TypeScript",
  "no-sort-without-comparator": "Array — Additional",
  "no-mutating-sort": "Array — Additional",
  "no-sparse-arrays": "Array — Additional",
  "no-array-constructor": "Array — Additional",
  "no-has-own-property": "Object — Additional",
  "no-promise-race": "Promise — Additional",
  "no-promise-any": "Promise — Additional",
  "no-new-promise": "Promise — Additional",
  "no-unhandled-rejection": "Promise — Additional",
  "no-spread-args": "Spread",
  "no-general-destructuring": "Destructuring",
};

const PRINCIPLE_LABELS: Record<string, string> = {
  explicitness: "Explicitness",
  immutability: "Immutability",
  both: "Both",
};

const CATEGORY_LABELS: Record<string, string> = {
  canonical: "canonical",
  "type-level": "type-level",
  "external-boundary": "external-boundary",
};

function autoFixLabel(autoFixable: boolean): string {
  return autoFixable ? "✅ yes" : "—";
}

function groupRulesBySection(entries: RuleEntry[]): Map<SectionName, RuleEntry[]> {
  const grouped = new Map<SectionName, RuleEntry[]>();
  for (const section of SECTION_ORDER) {
    grouped.set(section, []);
  }
  for (const rule of entries) {
    const section = RULE_ID_TO_SECTION[rule.id];
    if (section !== undefined) {
      const bucket = grouped.get(section);
      if (bucket !== undefined) {
        bucket.push(rule);
      }
    }
  }
  return grouped;
}

function renderTable(entries: RuleEntry[]): string {
  const rows = entries.map(function (rule) {
    const principle = PRINCIPLE_LABELS[rule.principle];
    const category = CATEGORY_LABELS[rule.category];
    const fix = autoFixLabel(rule.autoFixable);
    return `| \`${rule.banned}\` | \`${rule.canonical}\` | ${principle} | ${category} | ${fix} |`;
  });
  const header = "| Banned | Canonical | Principle | Category | Auto-fix |";
  const divider = "|---|---|---|---|---|";
  return [header, divider, ...rows].join("\n");
}

export function generateRulesMd(entries: RuleEntry[]): string {
  const grouped = groupRulesBySection(entries);
  const sections: string[] = [];

  sections.push("# Bedrock.js — Rules Reference");
  sections.push("");
  sections.push(
    "This document is **auto-generated** from `src/rules/registry.ts`. Do not edit by hand.",
  );
  sections.push("");

  sections.push("## Legend");
  sections.push("");
  sections.push("**Violation categories:**");
  sections.push("");
  sections.push(
    "- **canonical** — mechanically fixable by the Bedrock transformer; highest confidence",
  );
  sections.push(
    "- **type-level** — TypeScript type violations that require human judgment to fix (e.g. `any`, `as`, `!`); not auto-fixable",
  );
  sections.push(
    "- **external-boundary** — impure API interaction that cannot be rewritten (e.g. DOM, streams, DB clients, callback-based APIs)",
  );
  sections.push("");

  sections.push("**Principles:**");
  sections.push("");
  sections.push(
    "- **Explicitness** — prefer explicit multi-step operations over implicit combined ones",
  );
  sections.push(
    "- **Immutability** — prefer producing new values over mutating existing ones",
  );
  sections.push(
    "- **Both** — applies both principles simultaneously",
  );
  sections.push("");

  sections.push("## Principled Exceptions");
  sections.push("");
  sections.push(
    "- `array.map()`, `array.filter()`, and `array.reduce()` are **permitted**. They are immutable (return new values), single-purpose, and their explicit `for` loop equivalents require mutable accumulators. The Immutability Principle takes precedence.",
  );
  sections.push(
    "- **Early `return`** is explicitly **permitted and encouraged** — it is the canonical replacement for `break`, `continue`, and labeled jumps (via extraction into a named function).",
  );
  sections.push(
    "- **Incremental property assignment during initial object construction** is permitted — the mutation ban applies only to already-complete objects.",
  );
  sections.push(
    "- `Promise.all()` and `Promise.allSettled()` are **permitted** — they express concurrent execution explicitly.",
  );
  sections.push(
    "- **Destructuring** is allowed in two specific canonical positions only: `const [first, ...rest] = array` (head/rest split) and `const { foo, ...rest } = obj` (immutable delete). General destructuring is banned.",
  );
  sections.push(
    "- **Spread** is allowed only for immutable derivation: `[...array, x]`, `{ ...obj, key: val }`. Spread in function calls (`foo(...args)`) is banned.",
  );
  sections.push("");

  for (const section of SECTION_ORDER) {
    const sectionRules = grouped.get(section);
    if (sectionRules === undefined || sectionRules.length === 0) {
      continue;
    }
    sections.push(`## ${section}`);
    sections.push("");
    sections.push(renderTable(sectionRules));
    sections.push("");
  }

  return sections.join("\n");
}
