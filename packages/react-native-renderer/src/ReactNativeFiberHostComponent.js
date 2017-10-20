/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

var ReactNativeAttributePayload = require('./ReactNativeAttributePayload');

// Modules provided by RN:
var TextInputState = require('TextInputState');
var UIManager = require('UIManager');

var {
  mountSafeCallback,
  warnForStyleProps,
} = require('./NativeMethodsMixinUtils');

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethodsMixinType,
  ReactNativeBaseComponentViewConfig,
} from './ReactNativeTypes';
import type {Instance} from './ReactNativeFiberRenderer';

/**
 * This component defines the same methods as NativeMethodsMixin but without the
 * findNodeHandle wrapper. This wrapper is unnecessary for HostComponent views
 * and would also result in a circular require.js dependency (since
 * ReactNativeFiber depends on this component and NativeMethodsMixin depends on
 * ReactNativeFiber).
 */
class ReactNativeFiberHostComponent {
  _children: Array<Instance | number>;
  _nativeTag: number;
  viewConfig: ReactNativeBaseComponentViewConfig;

  constructor(tag: number, viewConfig: ReactNativeBaseComponentViewConfig) {
    this._nativeTag = tag;
    this._children = [];
    this.viewConfig = viewConfig;
  }

  blur() {
    TextInputState.blurTextInput(this._nativeTag);
  }

  focus() {
    TextInputState.focusTextInput(this._nativeTag);
  }

  measure(callback: MeasureOnSuccessCallback) {
    UIManager.measure(this._nativeTag, mountSafeCallback(this, callback));
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback(this, callback),
    );
  }

  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ) {
    UIManager.measureLayout(
      this._nativeTag,
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess),
    );
  }

  setNativeProps(nativeProps: Object) {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    var updatePayload = ReactNativeAttributePayload.create(
      nativeProps,
      this.viewConfig.validAttributes,
    );

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        this._nativeTag,
        this.viewConfig.uiViewClassName,
        updatePayload,
      );
    }
  }
}

// eslint-disable-next-line no-unused-expressions
(ReactNativeFiberHostComponent.prototype: NativeMethodsMixinType);

module.exports = ReactNativeFiberHostComponent;
