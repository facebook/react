/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ReactDebugTools = require('./src/ReactDebugTools');

// This is hacky but makes it work with both Rollup and Jest.
module.exports = ReactDebugTools.default || ReactDebugTools;
