/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactCompilerRule from './rules/ReactCompilerRule';
import { noSideEffectAfterMemo } from './rules/noSideEffectAfterMemo';

const meta = {
  name: 'eslint-plugin-react-compiler',
};

const rules = {
  'react-compiler': ReactCompilerRule,
  'no-side-effect-after-memo': noSideEffectAfterMemo,
};

const configs = {
  recommended: {
    plugins: {
      'react-compiler': {
        rules: {
          'react-compiler': ReactCompilerRule,
        },
      },
    },
    rules: {
      'react-compiler/react-compiler': 'error' as const,
    },
  },
};

export {configs, rules, meta};
