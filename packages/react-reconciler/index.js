/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

// TODO: bundle Flow types with the package.
export type {
  HostConfig,
  Deadline,
  Reconciler,
} from './src/ReactFiberReconciler';

module.exports = require('./src/ReactFiberReconciler');
