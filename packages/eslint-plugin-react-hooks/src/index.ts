/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Linter, Rule } from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import RulesOfHooks from './rules/RulesOfHooks';
import {
  allRules,
  mapErrorSeverityToESlint,
  recommendedRules,
} from './shared/ReactCompiler';

// ---------- Utilities ----------
const buildRulesRecord = (
  rules: Record<string, { rule: Rule.RuleModule }>
): Record<string, Rule.RuleModule> =>
  Object.fromEntries(
    Object.entries(rules).map(([name, config]) => [name, config.rule])
  );

const buildRecommendedConfigs = (
  rules: typeof recommendedRules
): Linter.RulesRecord =>
  Object.entries(rules).reduce<Linter.RulesRecord>((acc, [name, { severity }]) => {
    acc[`react-hooks/${name}`] = mapErrorSeverityToESlint(severity);
    return acc;
  }, {});

// ---------- Core Rules ----------
const rules: Record<string, Rule.RuleModule> = {
  'exhaustive-deps': ExhaustiveDeps,
  'rules-of-hooks': RulesOfHooks,
  ...buildRulesRecord(allRules),
};

// ---------- Recommended Config ----------
const ruleConfigs: Linter.RulesRecord = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  ...buildRecommendedConfigs(recommendedRules),
};

// ---------- Plugin Definition ----------
const plugin = {
  meta: { name: 'eslint-plugin-react-hooks' },
  rules,
  configs: {},
} as const;

// ---------- Shared Config Factory ----------
function createConfig(flat = false) {
  const baseConfig = { rules: ruleConfigs };

  if (flat) {
    return [
      {
        plugins: { 'react-hooks': plugin },
        ...baseConfig,
      },
    ];
  }
  return {
    plugins: ['react-hooks'],
    ...baseConfig,
  };
}

// ---------- Export Configs ----------
Object.assign(plugin.configs, {
  recommended: createConfig(),
  'recommended-legacy': createConfig(),
  'recommended-latest': createConfig(true),
  'flat/recommended': createConfig(true),
});

export default plugin;
