/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/Utils/ErrorCodes';
import {ValidateSetStateInRenderRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('no set state in render rule', ValidateSetStateInRenderRule, {
  valid: [],
  invalid: [
    {
      name: 'setState in useMemo',
      code: normalizeIndent`
      import {useMemo, useState} from 'react';

      function Component({item, cond}) {
        const [prevItem, setPrevItem] = useState(item);
        const [state, setState] = useState(0);

        useMemo(() => {
          if (cond) {
            setPrevItem(item);
            setState(0);
          }
          return item;
        }, [cond, item, init]);

        return <Child x={state} />;
      }
    `,
      errors: [
        makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_MEMO),
        makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_MEMO),
      ],
    },
    {
      name: 'unconditional setState in render',
      code: normalizeIndent`
      function Component(props) {
        const [x, setX] = useState(0);
        const aliased = setX;

        setX(1);
        aliased(2);

        return x;
      }`,
      errors: [
        makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_RENDER),
        makeTestCaseError(ErrorCode.INVALID_SET_STATE_IN_RENDER),
      ],
    },
  ],
});
