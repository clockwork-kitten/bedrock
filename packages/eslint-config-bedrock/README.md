# eslint-config-bedrock

ESLint flat config that enforces the [Bedrock.js](https://github.com/josephcarey/bedrock) canonical subset — the rules that have direct ESLint equivalents.

Bedrock.js is a semantic normalizer for JavaScript/TypeScript: where Prettier normalizes appearance, Bedrock normalizes *expression*. This config covers the mechanically-enforceable slice of those rules.

## Install

```sh
npm install --save-dev eslint-config-bedrock eslint
# or
bun add -d eslint-config-bedrock eslint
```

## Usage

In your `eslint.config.js` (ESLint flat config):

```js
import bedrockConfig from "eslint-config-bedrock";

export default [
  ...bedrockConfig,
  // your project overrides here
];
```

## Rules included

| Rule | Setting | What it enforces |
|---|---|---|
| `prefer-const` | `"error"` | Use `const` when a binding is never reassigned |
| `no-var` | `"error"` | Ban `var`; use `const` or `let` |
| `eqeqeq` | `["error", "always"]` | Ban `==`/`!=`; use `===`/`!==` |
| `no-plusplus` | `"error"` | Ban `++`/`--`; use `x = x + 1` |
| `operator-assignment` | `["error", "never"]` | Ban `+=`, `-=`, etc.; use explicit form |
| `no-class-assign` | `"error"` | Ban reassigning class names (partial class ban) |

> **Note:** Many Bedrock rules (no arrow functions, no ternary, no template literals, etc.) have no direct ESLint equivalent and are enforced by the Bedrock transformer/reporter instead. See the [full rule set](https://github.com/josephcarey/bedrock/blob/main/RULES.md) for the complete picture.

## Full rule set

See the [Bedrock.js repo](https://github.com/josephcarey/bedrock) for the complete specification, transformer, and reporter.
