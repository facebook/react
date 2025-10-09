/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {ESLint, Linter, Rule} from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import {
  allRules,
  mapErrorSeverityToESlint,
  recommendedRules,
  recommendedLatestRules,
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

const recommendedCompilerRuleConfigs = Object.fromEntries(
  Object.entries(recommendedRules).map(([name, ruleConfig]) => {
    return [
      `react-hooks/${name}` as const,
      mapErrorSeverityToESlint(ruleConfig.severity),
    ] as const;
  }),
) as Record<`react-hooks/${string}`, Linter.RuleEntry>;

const recommendedLatestCompilerRuleConfigs = Object.fromEntries(
  Object.entries(recommendedLatestRules).map(([name, ruleConfig]) => {
    return [
      `react-hooks/${name}` as const,
      mapErrorSeverityToESlint(ruleConfig.severity),
    ] as const;
  }),
) as Record<`react-hooks/${string}`, Linter.RuleEntry>;

const recommendedRuleConfigs: Linter.RulesRecord = {
  ...basicRuleConfigs,
  ...recommendedCompilerRuleConfigs,
};
const recommendedLatestRuleConfigs: Linter.RulesRecord = {
  ...basicRuleConfigs,
  ...recommendedLatestCompilerRuleConfigs,
};

const pluginsLegacy = ['react-hooks'];
const pluginsFlat = {
  'react-hooks': {}, // Assign after creating the plugin object
};

interface Plugin extends Omit<ESLint.Plugin, 'configs'> {
  configs: {
    recommended: Linter.LegacyConfig;
    'recommended-latest': Linter.LegacyConfig;
    flat: {
      recommended: Linter.Config;
      'recommended-latest': Linter.Config;
    };
  };
}

const plugin = {
  meta: {
    name: 'eslint-plugin-react-hooks',
    version: '7.0.0',
  },
  rules,
  configs: {
    recommended: {
      plugins: pluginsLegacy,
      rules: recommendedRuleConfigs,
    },
    'recommended-latest': {
      plugins: pluginsLegacy,
      rules: recommendedLatestRuleConfigs,
    },
    flat: {
      recommended: {
        plugins: pluginsFlat,
        rules: recommendedRuleConfigs,
      },
      'recommended-latest': {
        plugins: pluginsFlat,
        rules: recommendedLatestRuleConfigs,
      },
    },
  },
} satisfies Plugin;

pluginsFlat['react-hooks'] = plugin;

export default plugin;
