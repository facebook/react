/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/CompilerError';
import {UseMemoRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('use memo rule', UseMemoRule, {
  valid: [],
  invalid: [
    {
      name: 'Simple async violation',
      code: normalizeIndent`
      import {useMemo} from 'react';
      
      function Component({a, b}) {
        let x = useMemo(async () => {
          await a;
        }, []);
        return <Child x={x} />;
      }
    `,
      errors: [makeTestCaseError(ErrorCode.INVALID_USE_MEMO_CALLBACK_ASYNC)],
    },
    {
      name: 'Simple parameters violation',
      code: normalizeIndent`
      import {useMemo} from 'react';

      function Component() {
        let x = useMemo(c => a, []);
        return <Child x={x} />;
      }`,
      errors: [
        makeTestCaseError(ErrorCode.INVALID_USE_MEMO_CALLBACK_PARAMETERS),
      ],
    },
  ],
});
