/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/CompilerError';
import {NoImpureFunctionCallsRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('no impure function calls rule', NoImpureFunctionCallsRule, {
  valid: [],
  invalid: [
    {
      name: 'Known impure function calls are caught',
      code: normalizeIndent`
      function Component() {
        const date = Date.now();
        const now = performance.now();
        const rand = Math.random();
        return <Foo date={date} now={now} rand={rand} />;
      }
    `,
      errors: [
        makeTestCaseError(ErrorCode.IMPURE_FUNCTIONS),
        makeTestCaseError(ErrorCode.IMPURE_FUNCTIONS),
        makeTestCaseError(ErrorCode.IMPURE_FUNCTIONS),
      ],
    },
  ],
});
