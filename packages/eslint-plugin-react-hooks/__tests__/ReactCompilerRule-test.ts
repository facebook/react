/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorSeverity} from 'babel-plugin-react-compiler';
import {RuleTester as ESLintTester} from 'eslint';
import ReactCompilerRule from '../src/rules/ReactCompiler';

const ESLintTesterV8 = require('eslint-v8').RuleTester;

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings: TemplateStringsArray): string {
  const codeLines = strings[0]?.split('\n') ?? [];
  const leftPadding = codeLines[1]?.match(/\s+/)![0] ?? '';
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
          message: /Handle var kinds in VariableDeclaration/,
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
          message: /React Compiler has skipped optimizing this component/,
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
          message: /Handle var kinds in VariableDeclaration/,
        },
        {
          message: /Modifying component props or hook arguments is not allowed/,
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
          message: /Handle var kinds in VariableDeclaration/,
        },
      ],
    },
    {
      name: "'use no forget' does not disable eslint rule",
      code: normalizeIndent`
        let count = 0;
        function Component() {
          'use no forget';
          count = count + 1;
          return <div>Hello world {count}</div>
        }
      `,
      errors: [
        {
          message:
            /Cannot reassign variables declared outside of the component\/hook/,
        },
      ],
    },
    {
      name: "Unused 'use no forget' directive is reported when no errors are present on components",
      code: normalizeIndent`
        function Component() {
          'use no forget';
          return <div>Hello world</div>
        }
      `,
      errors: [
        {
          message: "Unused 'use no forget' directive",
          suggestions: [
            {
              output:
                // yuck
                '\nfunction Component() {\n  \n  return <div>Hello world</div>\n}\n',
            },
          ],
        },
      ],
    },
    {
      name: "Unused 'use no forget' directive is reported when no errors are present on non-components or hooks",
      code: normalizeIndent`
        function notacomponent() {
          'use no forget';
          return 1 + 1;
        }
      `,
      errors: [
        {
          message: "Unused 'use no forget' directive",
          suggestions: [
            {
              output:
                // yuck
                '\nfunction notacomponent() {\n  \n  return 1 + 1;\n}\n',
            },
          ],
        },
      ],
    },
    {
      name: 'Pipeline errors are reported',
      code: normalizeIndent`
        import useMyEffect from 'useMyEffect';
        import {AUTODEPS} from 'react';
        function Component({a}) {
          'use no memo';
          useMyEffect(() => console.log(a.b), AUTODEPS);
          return <div>Hello world</div>;
        }
      `,
      options: [
        {
          environment: {
            inferEffectDependencies: [
              {
                function: {
                  source: 'useMyEffect',
                  importSpecifierName: 'default',
                },
                autodepsIndex: 1,
              },
            ],
          },
        },
      ],
      errors: [
        {
          message: /Cannot infer dependencies of this effect/,
        },
      ],
    },
  ],
};

const eslintTester = new ESLintTesterV8({
  parser: require.resolve('hermes-eslint'),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    enableExperimentalComponentSyntax: true,
  },
});
eslintTester.run('react-compiler', ReactCompilerRule, tests);
