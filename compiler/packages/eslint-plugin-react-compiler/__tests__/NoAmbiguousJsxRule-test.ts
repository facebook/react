/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';
import ReactCompilerRule from '../src/rules/ReactCompilerRule';

testRule('no ambiguous JSX rule', ReactCompilerRule, {
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
      errors: [makeTestCaseError('Avoid constructing JSX within try/catch')],
    },
  ],
});
