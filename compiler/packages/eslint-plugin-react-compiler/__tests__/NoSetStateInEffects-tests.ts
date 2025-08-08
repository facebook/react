/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/Utils/ErrorCodes';
import {NoSetStateInEffectsRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('no set state in effects rule', NoSetStateInEffectsRule, {
  valid: [],
  invalid: [
    {
      name: 'unconditional setState in useEffect',
      code: normalizeIndent`
      import {useEffect, useState} from 'react';

      function Component() {
        const [state, setState] = useState(0);
        useEffect(() => {
          setState(s => s + 1);
        });
        return state;
      }
    `,
      errors: [makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_EFFECTS)],
    },
    {
      name: 'conditional setState in render',
      code: normalizeIndent`
      import {useEffect, useState} from 'react';

      function Component() {
        const [state, setState] = useState(0);
        useEffect(() => {
          if (state % 2 === 0) {
            setState(state + 1);
          }
        });
        return state;
      }
    `,
      errors: [makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_EFFECTS)],
    },
  ],
});
