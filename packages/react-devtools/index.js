/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {connectToDevTools} = require('react-devtools-core/backend');

// Connect immediately with default options.
// If you need more control, use `react-devtools-core` directly instead of `react-devtools`.
connectToDevTools();
