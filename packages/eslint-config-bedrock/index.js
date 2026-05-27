/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error","always"],
      "no-plusplus": "error",
      "operator-assignment": ["error","never"],
      "no-class-assign": "error",
      // no-template-curly-in-string is intentionally omitted —
      // it flags interpolation inside regular strings, not template literals,
      // which is the inverse of what Bedrock bans
    },
  },
];

export default config;
