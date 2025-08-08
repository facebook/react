/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/CompilerError';
import {NoRefAccessInRenderRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('no ref access in render rule', NoRefAccessInRenderRule, {
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
      errors: [makeTestCaseError(ErrorCode.NO_REF_ACCESS_IN_RENDER)],
    },
  ],
});
