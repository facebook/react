/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ViewConfig} from './ReactNativeTypes';
import type {
  LegacyPublicInstance,
  MeasureOnSuccessCallback,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import type {Instance} from './ReactFiberConfigNative';

// Modules provided by RN:
import {
  TextInputState,
  UIManager,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {create} from './ReactNativeAttributePayload';
import {
  mountSafeCallback_NOT_REALLY_SAFE,
  warnForStyleProps,
} from './NativeMethodsMixinUtils';

class ReactNativeFiberHostComponent implements LegacyPublicInstance {
  _children: Array<Instance | number>;
  _nativeTag: number;
  _internalFiberInstanceHandleDEV: Object;
  viewConfig: ViewConfig;

  constructor(
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandleDEV: Object,
  ) {
    this._nativeTag = tag;
    this._children = [];
    this.viewConfig = viewConfig;
    if (__DEV__) {
      this._internalFiberInstanceHandleDEV = internalInstanceHandleDEV;
    }
  }

  blur() {
    TextInputState.blurTextInput(this);
  }

  focus() {
    TextInputState.focusTextInput(this);
  }

  measure(callback: MeasureOnSuccessCallback) {
    UIManager.measure(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback),
    );
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback),
    );
  }

  measureLayout(
    relativeToNativeNode: number | LegacyPublicInstance,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    let relativeNode: ?number;

    if (typeof relativeToNativeNode === 'number') {
      // Already a node handle
      relativeNode = relativeToNativeNode;
    } else {
      const nativeNode: ReactNativeFiberHostComponent =
        (relativeToNativeNode: any);
      if (nativeNode._nativeTag) {
        relativeNode = nativeNode._nativeTag;
      }
    }

    if (relativeNode == null) {
      if (__DEV__) {
        console.error(
          'ref.measureLayout must be called with a node handle or a ref to a native component.',
        );
      }

      return;
    }

    UIManager.measureLayout(
      this._nativeTag,
      relativeNode,
      mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
      mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess),
    );
  }

  setNativeProps(nativeProps: Object) {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    const updatePayload = create(nativeProps, this.viewConfig.validAttributes);

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

export default ReactNativeFiberHostComponent;
