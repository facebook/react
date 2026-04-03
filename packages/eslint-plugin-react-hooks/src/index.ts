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

const plugins = ['react-hooks'];

type ReactHooksFlatConfig = {
  plugins: {'react-hooks': typeof plugin};
  rules: Linter.RulesRecord;
};

const plugin = {
  meta: {
    name: 'eslint-plugin-react-hooks',
    version: '7.0.0',
  },
  rules,
  configs: {
    recommended: {
      plugins,
      rules: recommendedRuleConfigs,
    },
    'recommended-latest': {
      plugins,
      rules: recommendedLatestRuleConfigs,
    },
    flat: {
      recommended: {
        plugins: {'react-hooks': null as unknown as typeof plugin},
        rules: recommendedRuleConfigs,
      },
      'recommended-latest': {
        plugins: {'react-hooks': null as unknown as typeof plugin},
        rules: recommendedLatestRuleConfigs,
      },
    } as {
      recommended: ReactHooksFlatConfig;
      'recommended-latest': ReactHooksFlatConfig;
    },
  },
};

// Assign the plugin reference after plugin object is created
plugin.configs.flat.recommended.plugins['react-hooks'] = plugin;
plugin.configs.flat['recommended-latest'].plugins['react-hooks'] = plugin;

export default plugin;
