/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {ESLint, Linter, Rule} from 'eslint';

import ExhaustiveDeps from './rules/ExhaustiveDeps';
import ReactCompiler from './rules/ReactCompiler';
import RulesOfHooks from './rules/RulesOfHooks';

// All rules
const rules = {
  'exhaustive-deps': ExhaustiveDeps,
  'react-compiler': ReactCompiler,
  'rules-of-hooks': RulesOfHooks,
} satisfies Record<string, Rule.RuleModule>;

// Config rules
const configRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
} satisfies Linter.RulesRecord;

// Flat config
const recommendedConfig = {
  name: 'react-hooks/recommended',
  plugins: {
    get 'react-hooks'(): ESLint.Plugin {
      return plugin;
    },
  },
  rules: configRules,
};

// Plugin object
const plugin = {
  // TODO: Make this more dynamic to populate version from package.json.
  // This can be done by injecting at build time, since importing the package.json isn't an option in Meta
  meta: {name: 'eslint-plugin-react-hooks'},
  rules,
  configs: {
    /** Legacy recommended config, to be used with rc-based configurations */
    'recommended-legacy': {
      plugins: ['react-hooks'],
      rules: configRules,
    },

    /**
     * Recommended config, to be used with flat configs.
     */
    recommended: recommendedConfig,

    /** @deprecated please use `recommended`; will be removed in v7  */
    'recommended-latest': recommendedConfig,
  },
} satisfies ESLint.Plugin;

const configs = plugin.configs;
const meta = plugin.meta;
export {configs, meta, rules};

// TODO: If the plugin is ever updated to be pure ESM and drops support for rc-based configs, then it should be exporting the plugin as default
// instead of individual named exports.
// export default plugin;
