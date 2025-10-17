/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';
import ReactCompilerRule from '../src/rules/ReactCompilerRule';

testRule('no ref access in render rule', ReactCompilerRule, {
  valid: [],
  invalid: [
    {
      name: 'validate against simple ref access in render',
      code: normalizeIndent`
      function Component(props) {
        const ref = useRef(null);
        const value = ref.current;
        return value;
      }
    `,
      errors: [makeTestCaseError('Cannot access refs during render')],
    },
  ],
});
