/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import RulesOfHooks from './RulesOfHooks';
import ExhaustiveDeps from './ExhaustiveDeps';
import type {ESLint, Linter, Rule} from 'eslint';

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
  // TODO: Make this more dynamic to populate version from package.json.
  // This can be done by injecting at build time, since importing the package.json isn't an option in Meta
  meta: {name: 'eslint-plugin-react-hooks'},
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

const configs = plugin.configs;
const meta = plugin.meta;
export {configs, meta, rules};

// TODO: If the plugin is ever updated to be pure ESM and drops support for rc-based configs, then it should be exporting the plugin as default
// instead of individual named exports.
// export default plugin;
