/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

export opaque type PublicInstance = mixed;
export opaque type PublicTextInstance = mixed;

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
  get legacySendAccessibilityEvent() {
    return require('./legacySendAccessibilityEvent');
  },
  get RawEventEmitter() {
    return require('./RawEventEmitter').default;
  },
  get getNativeTagFromPublicInstance() {
    return require('./getNativeTagFromPublicInstance').default;
  },
  get getNodeFromPublicInstance() {
    return require('./getNodeFromPublicInstance').default;
  },
  get createPublicInstance() {
    return require('./createPublicInstance').default;
  },
  get createPublicTextInstance() {
    return require('./createPublicTextInstance').default;
  },
};
