/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

module.exports = {
  get BatchedBridge() {
    return require('./BatchedBridge.js');
  },
  get Platform() {
    return require('./Platform');
  },
  get RCTEventEmitter() {
    return require('./RCTEventEmitter');
  },
  get ReactFiberErrorDialog() {
    return require('./ReactFiberErrorDialog');
  },
  get ReactNativeViewConfigRegistry() {
    return require('./ReactNativeViewConfigRegistry');
  },
  get TextInputState() {
    return require('./TextInputState');
  },
  get UIManager() {
    return require('./UIManager');
  },
  get deepDiffer() {
    return require('./deepDiffer');
  },
  get deepFreezeAndThrowOnMutationInDev() {
    return require('./deepFreezeAndThrowOnMutationInDev');
  },
  get flattenStyle() {
    return require('./flattenStyle');
  },
};
