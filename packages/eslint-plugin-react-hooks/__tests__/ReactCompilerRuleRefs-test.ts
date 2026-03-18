/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {RuleTester} from 'eslint';
import {allRules} from '../src/shared/ReactCompiler';

const ESLintTesterV8 = require('eslint-v8').RuleTester;

type CompilerTestCases = {
  valid: RuleTester.ValidTestCase[];
  invalid: RuleTester.InvalidTestCase[];
};

const tests: CompilerTestCases = {
  valid: [
    {
      name: 'does not mark entire props object as ref when using ref prop',
      filename: 'test.js',
      code: `
        function Test(props) {
          return (
            <div>
              <button ref={props.buttonRef}>{props.text}</button>
            </div>
          );
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'disallows direct ref access during render',
      filename: 'test.js',
      code: `
        import {useRef} from 'react';
        function Test() {
          const ref = useRef(null);
          return <div>{ref.current}</div>;
        }
      `,
      errors: [{message: /Cannot access refs during render/}],
    },
  ],
};

const eslintTester = new ESLintTesterV8({
  parser: require.resolve('hermes-eslint'),
  parserOptions: {
    sourceType: 'module',
  },
});

eslintTester.run('react-compiler refs', allRules['refs'].rule, tests);
