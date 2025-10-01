/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {Linter, Rule} from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import {allRules} from './shared/ReactCompiler';
import RulesOfHooks from './rules/RulesOfHooks';

// All rules
const rules = {
  'exhaustive-deps': ExhaustiveDeps,
  'rules-of-hooks': RulesOfHooks,
  ...Object.fromEntries(
    Object.entries(allRules).map(([name, config]) => [name, config.rule]),
  ),
} satisfies Record<string, Rule.RuleModule>;

// Config rules
const ruleConfigs = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
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
