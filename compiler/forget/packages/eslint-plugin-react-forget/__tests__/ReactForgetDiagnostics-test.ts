import BabelESLintParser from "@babel/eslint-parser";
import { RuleTester as ESLintTester } from "eslint";
import ReactForgetDiagnostics from "../src/rules/ReactForgetDiagnostics";

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings: TemplateStringsArray): string {
  const codeLines = strings[0].split("\n");
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map((line) => line.slice(leftPadding.length)).join("\n");
}

const tests = {
  valid: [
    {
      name: "Basic example",
      code: normalizeIndent`
        function foo(x, y) {
          if (x) {
            return foo(false, y);
          }
          return [y * 10];
        }
      `,
    },
  ],
  invalid: [],
};

const eslintTester = new ESLintTester({
  parser: BabelESLintParser,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
});
eslintTester.run("react-forget-diagnostics", ReactForgetDiagnostics, tests);
