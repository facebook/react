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
            "[ReactForget] InvalidInput: Ref values (the `current` property) may not be accessed during render. Cannot access ref value at freeze $22:TObject<BuiltInRefValue> (6:6)",
          line: 6,
          column: 10,
          endColumn: 15,
          endLine: 6,
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
