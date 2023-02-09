/**
 * Our philosophy for linting is that lints should be very high-signal:
 * - Error, don't warn. If it's worth mentioning it's worth fixing.
 * - Enable rules that consistently identify real problems. If we frequently would have to
 *   disable the rule due to false positives, it isn't high-signal.
 * - Enable rules that help improve consistent style (to avoid code review about style rather
 *   than substance).
 */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    // We prefer using const where variables are not reassigned, but occassional mistakes
    // aren't a major issue
    "prefer-const": "off",

    // Not valuable enough to enable
    "no-useless-escape": "off",
    "@typescript-eslint/no-empty-function": "off",

    // Explicitly casting to/through any is sometimes required, often for error messages to
    // assertExhaustive()
    "@typescript-eslint/no-explicit-any": "off",

    // We use non-null assertions carefully. Ideally, there would be a TS option to codegen
    // a non-null check at the assertion site.
    "@typescript-eslint/no-non-null-assertion": "off",

    // Being explicit provides value in cases where inference may later change
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/explicit-function-return-type": "error",

    // Unused variables are frequently a bug. Ideally this rule would ignore identifiers
    // prefixed with "_", though, so that we don't need suppressions in legit cases.
    // TODO: build a custom version of this rule that understands "_" as a prefix.
    "@typescript-eslint/no-unused-vars": "error",

    // Consider enabling for consistency. Ideally violations could be auto-fixed.
    "@typescript-eslint/consistent-generic-constructors": [
      "off",
      "constructor",
    ],
    "@typescript-eslint/array-type": ["off", "generic"],
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  ignorePatterns: ["src/__tests__/**/*", "src/**/*.d.ts", "packages/**/*"],

  // If rules need to be disabled then the rule is insufficiently high signal
  // and should be diasbled altogether or customized (in either case via a standalone PR)
  noInlineConfig: true,
  reportUnusedDisableDirectives: true,
};
