/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorSeverity} from 'babel-plugin-react-compiler/src';
import {RuleTester as ESLintTester} from 'eslint';
import ReactCompilerRule from '../src/rules/ReactCompilerRule';

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings: TemplateStringsArray): string {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)![0];
  return codeLines.map(line => line.slice(leftPadding.length)).join('\n');
}

type CompilerTestCases = {
  valid: ESLintTester.ValidTestCase[];
  invalid: ESLintTester.InvalidTestCase[];
};

const tests: CompilerTestCases = {
  valid: [
    {
      name: 'Basic example',
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
      name: 'Violation with Flow suppression',
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
      name: 'Basic example with component syntax',
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
      name: 'Unsupported syntax',
      code: normalizeIndent`
        function foo(x) {
          var y = 1;
          return y * x;
        }
      `,
    },
    {
      // OK because invariants are only meant for the compiler team's consumption
      name: '[Invariant] Defined after use',
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
      name: '[InvalidInput] Ref access during render',
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
      name: 'Reportable levels can be configured',
      options: [{reportableLevels: new Set([ErrorSeverity.Todo])}],
      code: normalizeIndent`
        function Foo(x) {
          var y = 1;
          return <div>{y * x}</div>;
        }`,
      errors: [
        {
          message:
            '(BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration',
        },
      ],
    },
    {
      name: '[InvalidReact] ESlint suppression',
      // Indentation is intentionally weird so it doesn't add extra whitespace
      code: normalizeIndent`
  function Component(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
    return <div>{props.foo}</div>;
  }`,
      errors: [
        {
          message:
            'React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior',
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
    {
      name: 'Multiple diagnostics are surfaced',
      options: [
        {
          reportableLevels: new Set([
            ErrorSeverity.Todo,
            ErrorSeverity.InvalidReact,
          ]),
        },
      ],
      code: normalizeIndent`
        function Foo(x) {
          var y = 1;
          return <div>{y * x}</div>;
        }
        function Bar(props) {
          props.a.b = 2;
          return <div>{props.c}</div>
        }`,
      errors: [
        {
          message:
            '(BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration',
        },
        {
          message:
            'Mutating component props or hook arguments is not allowed. Consider using a local variable instead',
        },
      ],
    },
    {
      name: 'Test experimental/unstable report all bailouts mode',
      options: [
        {
          reportableLevels: new Set([ErrorSeverity.InvalidReact]),
          __unstable_donotuse_reportAllBailouts: true,
        },
      ],
      code: normalizeIndent`
        function Foo(x) {
          var y = 1;
          return <div>{y * x}</div>;
        }`,
      errors: [
        {
          message:
            '[ReactCompilerBailout] (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration (@:3:2)',
        },
      ],
    },
  ],
};

const eslintTester = new ESLintTester({
  parser: require.resolve('hermes-eslint'),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    enableExperimentalComponentSyntax: true,
  },
});
eslintTester.run('react-compiler', ReactCompilerRule, tests);
