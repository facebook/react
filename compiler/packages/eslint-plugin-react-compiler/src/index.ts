/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {allRules, recommendedRules} from './rules/ReactCompilerRule';

const meta = {
  name: 'eslint-plugin-react-compiler',
};

const configs = {
  recommended: {
    plugins: {
      'react-compiler': {
        rules: allRules,
      },
    },
    rules: Object.fromEntries(
      Object.keys(recommendedRules).map(ruleName => [
        'react-compiler/' + ruleName,
        'error',
      ]),
    ) as Record<string, 'error' | 'warn'>,
  },
};

export {configs, allRules as rules, meta};
