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

type ForgetTestCases = {
  valid: ESLintTester.ValidTestCase[];
  invalid: ESLintTester.InvalidTestCase[];
};

const tests: ForgetTestCases = {
  valid: [
    {
      name: "Basic example",
      code: normalizeIndent`
        function foo(x, y) {
          'use forget';
          if (x) {
            return foo(false, y);
          }
          return [y * 10];
        }
      `,
    },
    {
      name: "Unsupported syntax",
      code: normalizeIndent`
        function foo(x) {
          'use forget';
          var y = 1;
          return y * x;
        }
      `,
    },
    {
      // OK because invariants are only meant for the compiler team's consumption
      name: "[Invariant] Defined after use",
      code: normalizeIndent`
        function Component(props) {
          'use forget';
          let y = function () {
            m(x);
          };

          let x = { a };
          m(x);
          return y;
        }
      `,
    },
  ],
  invalid: [
    {
      name: "[InvalidInput] Ref access during render",
      code: normalizeIndent`
        function Component(props) {
          'use forget';
          const ref = useRef(null);
          const value = ref.current;
          return value;
        }
      `,
      errors: [
        {
          message:
            "[ReactForget] Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)",
          line: 6,
          column: 10,
          endColumn: 15,
          endLine: 6,
        },
      ],
    },
    {
      name: "[InvalidReact] ESlint suppression",
      // Indentation is intentionally weird so it doesn't add extra whitespace
      code: normalizeIndent`
  function Component(props) {
    'use forget';
  // eslint-disable-next-line react-hooks/rules-of-hooks
    Component();
  }`,
      errors: [
        {
          message:
            "[ReactForget] React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior",
          suggestions: [
            {
              output: normalizeIndent`
  function Component(props) {
    'use forget';

    Component();
  }`,
            },
          ],
        },
        {
          message:
            "Definition for rule 'react-hooks/rules-of-hooks' was not found.",
        },
      ],
    },
  ],
};

const eslintTester = new ESLintTester({
  parser: BabelESLintParser,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
});
eslintTester.run("react-forget-diagnostics", ReactForgetDiagnostics, tests);
