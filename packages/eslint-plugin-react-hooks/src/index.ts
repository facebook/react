/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {Linter, Rule} from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import {
  allRules,
  mapErrorSeverityToESlint,
  recommendedRules,
} from './shared/ReactCompiler';
import RulesOfHooks from './rules/RulesOfHooks';

// All rules
const rules = {
  'exhaustive-deps': ExhaustiveDeps,
  'rules-of-hooks': RulesOfHooks,
  ...Object.fromEntries(
    Object.entries(allRules).map(([name, config]) => [name, config.rule]),
  ),
} satisfies Record<string, Rule.RuleModule>;

// Basic hooks rules (for recommended config)
const basicRuleConfigs = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
} as const satisfies Linter.RulesRecord;

const compilerRuleConfigs = Object.fromEntries(
  Object.entries(recommendedRules).map(([name, ruleConfig]) => {
    return [
      `react-hooks/${name}` as const,
      mapErrorSeverityToESlint(ruleConfig.severity),
    ] as const;
  }),
) as Record<`react-hooks/${string}`, Linter.RuleEntry>;

// All rules including compiler rules (for recommended-latest config)
const allRuleConfigs: Linter.RulesRecord = {
  ...basicRuleConfigs,
  ...compilerRuleConfigs,
};

type FlatConfig = {
  plugins: Record<string, any>;
  rules: Linter.RulesRecord;
};

const plugin = {
  meta: {
    name: 'eslint-plugin-react-hooks',
  },
  rules,
  configs: {} as {
    'recommended-legacy': {
      plugins: Array<string>;
      rules: Linter.RulesRecord;
    };
    'recommended-latest-legacy': {
      plugins: Array<string>;
      rules: Linter.RulesRecord;
    };
    'flat/recommended': Array<FlatConfig>;
    'recommended-latest': Array<FlatConfig>;
    recommended: Array<FlatConfig>;
  },
};

Object.assign(plugin.configs, {
  'recommended-legacy': {
    plugins: ['react-hooks'],
    rules: basicRuleConfigs,
  },

  'recommended-latest-legacy': {
    plugins: ['react-hooks'],
    rules: allRuleConfigs,
  },

  'flat/recommended': [
    {
      plugins: {
        'react-hooks': plugin,
      },
      rules: basicRuleConfigs,
    },
  ],

  'recommended-latest': [
    {
      plugins: {
        'react-hooks': plugin,
      },
      rules: allRuleConfigs,
    },
  ],

  recommended: [
    {
      plugins: {
        'react-hooks': plugin,
      },
      rules: basicRuleConfigs,
    },
  ],
});

export default plugin;
