/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/Utils/ErrorCodes';
import {NoAmbiguousJsxRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('no ambiguous JSX rule', NoAmbiguousJsxRule, {
  valid: [],
  invalid: [
    {
      name: 'JSX in try blocks are warned against',
      code: normalizeIndent`
      function Component(props) {
        let el;
        try {
          el = <Child />;
        } catch {
          return null;
        }
        return el;
      }
    `,
      errors: [makeTestCaseError(ErrorCode.JSX_IN_TRY)],
    },
  ],
});
