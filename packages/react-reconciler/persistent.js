/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// This is the same export as in index.js,
// with persistent reconciler flags turned on.
const ReactFiberReconciler = require('./src/ReactFiberReconciler');

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.
module.exports = ReactFiberReconciler.default || ReactFiberReconciler;
