/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {Linter, Rule} from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import {allRules, recommendedRules} from './shared/ReactCompiler';
import RulesOfHooks from './rules/RulesOfHooks';

// All rules
const rules = {
  'exhaustive-deps': ExhaustiveDeps,
  'rules-of-hooks': RulesOfHooks,
  ...allRules,
} satisfies Record<string, Rule.RuleModule>;

// Config rules
const ruleConfigs = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  ...Object.fromEntries(
    Object.keys(recommendedRules).map(name => ['react-hooks/' + name, 'error']),
  ),
} satisfies Linter.RulesRecord;

const plugin = {
  meta: {
    name: 'eslint-plugin-react-hooks',
  },
  configs: {},
  rules,
};

Object.assign(plugin.configs, {
  'recommended-legacy': {
    plugins: ['react-hooks'],
    rules: ruleConfigs,
  },

  'flat/recommended': [
    {
      plugins: {
        'react-hooks': plugin,
      },
      rules: ruleConfigs,
    },
  ],

  'recommended-latest': [
    {
      plugins: {
        'react-hooks': plugin,
      },
      rules: ruleConfigs,
    },
  ],

  recommended: {
    plugins: ['react-hooks'],
    rules: ruleConfigs,
  },
});

export default plugin;
