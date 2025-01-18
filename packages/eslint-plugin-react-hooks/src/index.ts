/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import RulesOfHooks from './RulesOfHooks';
import ExhaustiveDeps from './ExhaustiveDeps';
import type {ESLint, Linter, Rule} from 'eslint';

const packageJson: {name: string; version: string} = require('../package.json');

// All rules
const rules = {
  'rules-of-hooks': RulesOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
} satisfies Record<string, Rule.RuleModule>;

// Config rules
const configRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
} satisfies Linter.RulesRecord;

// Legacy config
const legacyRecommendedConfig = {
  plugins: ['react-hooks'],
  rules: configRules,
} satisfies Linter.LegacyConfig;

// Plugin object
const plugin = {
  meta: {name: packageJson.name, version: packageJson.version},
  rules,
  configs: {
    /** Legacy recommended config, to be used with rc-based configurations */
    'recommended-legacy': legacyRecommendedConfig,

    /**
     * 'recommended' is currently aliased to the legacy / rc recommended config) to maintain backwards compatibility.
     * This is deprecated and in v6, it will switch to alias the flat recommended config.
     */
    recommended: legacyRecommendedConfig,

    /** Latest recommended config, to be used with flat configurations */
    'recommended-latest': {
      name: 'react-hooks/recommended',
      plugins: {
        get 'react-hooks'(): ESLint.Plugin {
          return plugin;
        },
      },
      rules: configRules,
    },
  },
} satisfies ESLint.Plugin;

// These exports are for backwards compatibility with eslint versions before v9
const configs = plugin.configs;
export {configs, rules};

export default plugin;
