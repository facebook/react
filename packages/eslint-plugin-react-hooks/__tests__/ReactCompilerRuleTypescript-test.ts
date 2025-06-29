/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {RuleTester} from 'eslint';
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
  valid: RuleTester.ValidTestCase[];
  invalid: RuleTester.InvalidTestCase[];
};

const tests: CompilerTestCases = {
  valid: [
    {
      name: 'Basic example',
      filename: 'test.tsx',
      code: normalizeIndent`
        function Button(props) {
          return null;
        }
      `,
    },
    {
      name: 'Repro for hooks as normal values',
      filename: 'test.tsx',
      code: normalizeIndent`
        function Button(props) {
          const scrollview = React.useRef<ScrollView>(null);
          return <Button thing={scrollview} />;
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'Mutating useState value',
      filename: 'test.tsx',
      code: `
        import { useState } from 'react';
        function Component(props) {
          // typescript syntax that hermes-parser doesn't understand yet
          const x: \`foo\${1}\` = 'foo1';
          const [state, setState] = useState({a: 0});
          state.a = 1;
          return <div>{props.foo}</div>;
        }
      `,
      errors: [
        {
          message:
            "Mutating a value returned from 'useState()', which should not be mutated. Use the setter function to update instead",
          line: 7,
        },
      ],
    },
    {
      name: 'useDeepMemo accessing ref.current during render',
      filename: 'test.tsx',
      code: normalizeIndent`
        import { equal } from "@wry/equality";
        import type { DependencyList } from "react";
        import * as React from "react";

        export function useDeepMemo<TValue>(
          memoFn: () => TValue,
          deps: DependencyList
        ) {
          const ref = React.useRef<{ deps: DependencyList; value: TValue }>(void 0);
          if (!ref.current || !equal(ref.current.deps, deps)) {
            ref.current = { value: memoFn(), deps };
          }
          return ref.current.value;
        }
      `,
      errors: [
        {
          message:
            'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
          line: 11,
        },
        {
          message:
            'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
          line: 11,
        },
        {
          message:
            'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
          line: 12,
        },
        {
          message:
            'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
          line: 14,
        },
      ],
    },
  ],
};

const eslintTester = new ESLintTesterV8({
  parser: require.resolve('@typescript-eslint/parser-v5'),
});
eslintTester.run('react-compiler - eslint: v8', ReactCompilerRule, tests);
