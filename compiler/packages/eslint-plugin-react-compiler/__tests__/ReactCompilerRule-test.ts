/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RuleTester as ESLintTester } from "eslint";
import ReactCompilerRule from "../src/rules/ReactCompilerRule";

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
          if (x) {
            return foo(false, y);
          }
          return [y * 10];
        }
      `,
    },
    {
      name: "Violation with Flow suppression",
      code: `
      // Valid since error already suppressed with flow.
      function useHookWithHook() {
        if (cond) {
          // $FlowFixMe[react-rule-hook]
          useConditionalHook();
        }
      }
    `,
    },
    {
      name: "Basic example with component syntax",
      code: normalizeIndent`
        export default component HelloWorld(
          text: string = 'Hello!',
          onClick: () => void,
        ) {
          return <div onClick={onClick}>{text}</div>;
        }
      `,
    },
    {
      name: "Unsupported syntax",
      code: normalizeIndent`
        function foo(x) {
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
          let y = function () {
            m(x);
          };

          let x = { a };
          m(x);
          return y;
        }
      `,
    },
    {
      name: "Classes don't throw",
      code: normalizeIndent`
        class Foo {
          #bar() {}
        }
      `,
    },
    {
      // TODO(gsn): Move this to invalid test suite, when we turn on
      // validateRefAccessDuringRender validation
      name: "[InvalidInput] Ref access during render",
      code: normalizeIndent`
        function Component(props) {
          const ref = useRef(null);
          const value = ref.current;
          return value;
        }
      `,
    },
  ],
  invalid: [
    {
      name: "[InvalidReact] ESlint suppression",
      // Indentation is intentionally weird so it doesn't add extra whitespace
      code: normalizeIndent`
  function Component(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
    return <div>{props.foo}</div>;
  }`,
      errors: [
        {
          message:
            "React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior",
          suggestions: [
            {
              output: normalizeIndent`
  function Component(props) {

    return <div>{props.foo}</div>;
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
  parser: require.resolve("hermes-eslint"),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: "module",
    enableExperimentalComponentSyntax: true,
  },
});
eslintTester.run("react-compiler", ReactCompilerRule, tests);
