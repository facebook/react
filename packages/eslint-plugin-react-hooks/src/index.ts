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

const rules = {
  'exhaustive-deps': ExhaustiveDeps,
  'rules-of-hooks': RulesOfHooks,
  ...Object.fromEntries(
    Object.entries(allRules).map(([name, config]) => [name, config.rule]),
  ),
} satisfies Record<string, Rule.RuleModule>;

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

const allRuleConfigs: Linter.RulesRecord = {
  ...basicRuleConfigs,
  ...compilerRuleConfigs,
};

const plugins = ['react-hooks'];

type ReactHooksFlatConfig = {
  plugins: Record<string, any>;
  rules: Linter.RulesRecord;
};

const configs = {
  'recommended-legacy': {
    plugins,
    rules: basicRuleConfigs,
  },
  'recommended-latest-legacy': {
    plugins,
    rules: allRuleConfigs,
  },
  'flat/recommended': {
    plugins,
    rules: basicRuleConfigs,
  },
  'recommended-latest': {
    plugins,
    rules: allRuleConfigs,
  },
  recommended: {
    plugins,
    rules: basicRuleConfigs,
  },
  flat: {} as Record<string, ReactHooksFlatConfig>,
};

const plugin = {
  meta: {
    name: 'eslint-plugin-react-hooks',
  },
  rules,
  configs,
};

Object.assign(configs.flat, {
  'recommended-legacy': {
    plugins: {'react-hooks': plugin},
    rules: configs['recommended-legacy'].rules,
  },
  'recommended-latest-legacy': {
    plugins: {'react-hooks': plugin},
    rules: configs['recommended-latest-legacy'].rules,
  },
  'flat/recommended': {
    plugins: {'react-hooks': plugin},
    rules: configs['flat/recommended'].rules,
  },
  'recommended-latest': {
    plugins: {'react-hooks': plugin},
    rules: configs['recommended-latest'].rules,
  },
  recommended: {
    plugins: {'react-hooks': plugin},
    rules: configs.recommended.rules,
  },
});

export default plugin;
