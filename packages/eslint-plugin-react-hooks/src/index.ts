/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import RulesOfHooks from './RulesOfHooks';
import ExhaustiveDeps from './ExhaustiveDeps';

// All rules
export const rules = {
  'rules-of-hooks': RulesOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
};

// Config rules
const configRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
};

// Legacy config
const legacyRecommendedConfig = {
  plugins: ['react-hooks'],
  rules: configRules,
};

// Base plugin object
const reactHooksPlugin = {
  meta: {name: 'eslint-plugin-react-hooks'},
  rules,
};

// Flat config
const flatRecommendedConfig = {
  name: 'react-hooks/recommended',
  plugins: {'react-hooks': reactHooksPlugin},
  rules: configRules,
};

export const configs = {
  /** Legacy recommended config, to be used with rc-based configurations */
  'recommended-legacy': legacyRecommendedConfig,

  /** Latest recommended config, to be used with flat configurations */
  'recommended-latest': flatRecommendedConfig,

  /**
   * 'recommended' is currently aliased to the legacy / rc recommended config) to maintain backwards compatibility.
   * This is deprecated and in v6, it will switch to alias the flat recommended config.
   */
  recommended: legacyRecommendedConfig,
};

export default {
  ...reactHooksPlugin,
  configs,
};
