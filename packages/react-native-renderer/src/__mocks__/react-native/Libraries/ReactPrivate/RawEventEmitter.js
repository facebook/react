/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// See the react-native repository for a full implementation.
// However, this is just an EventEmitter.
const RawEventEmitter = {
  emit: jest.fn(),
};

module.exports = {default: RawEventEmitter};
