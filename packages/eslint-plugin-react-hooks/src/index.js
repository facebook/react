/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import RulesOfHooks from './RulesOfHooks';
import ExhaustiveDeps from './ExhaustiveDeps';

const {name, version} = require('../package.json');

// All rules
export const rules = {
  'rules-of-hooks': RulesOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
};

// Rule configs
const configRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
};

// Legacy configs
export const configs = {
  recommended: {
    plugins: ['react-hooks'],
    rules: configRules,
  },
};

// Base plugin object
const reactHooksPlugin = {
  meta: {name, version},
  rules,
};

// Flat configs
export const flatConfigs = {
  recommended: {
    name: 'react-hooks/recommended',
    plugins: {'react-hooks': reactHooksPlugin},
    rules: configRules,
  },
};

export default {
  ...reactHooksPlugin,
  configs,
  flatConfigs,
};
