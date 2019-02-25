/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import RuleOfHooks from './RulesOfHooks';
import ExhaustiveDeps from './ExhaustiveDeps';

export const rules = {
  'rules-of-hooks': RuleOfHooks,
  'exhaustive-deps': ExhaustiveDeps,
};
