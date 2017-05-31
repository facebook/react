/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponent
 * @flow
 * @format
 */

'use strict';

const React = require('react');
const ReactNativeAttributePayload = require('ReactNativeAttributePayload');
const ReactNativeFeatureFlags = require('ReactNativeFeatureFlags');
const TextInputState = require('TextInputState');
const UIManager = require('UIManager');

const findNodeHandle = require('findNodeHandle');

const {mountSafeCallback} = require('NativeMethodsMixinUtils');

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethodsMixinType,
} from 'ReactNativeTypes';
import type {
  ReactNativeBaseComponentViewConfig,
} from 'ReactNativeViewConfigRegistry';

const findNumericNodeHandle = ReactNativeFeatureFlags.useFiber
  ? require('findNumericNodeHandleFiber')
  : require('findNumericNodeHandleStack');

/**
 * Superclass that provides methods to access the underlying native component.
 * This can be useful when you want to focus a view or measure its dimensions.
 *
 * Methods implemented by this class are available on most default components
 * provided by React Native. However, they are *not* available on composite
 * components that are not directly backed by a native view. For more
 * information, see [Direct Manipulation](docs/direct-manipulation.html).
 *
 * @abstract
 */
class ReactNativeComponent<DefaultProps, Props, State>
  extends React.Component<DefaultProps, Props, State> {
  static defaultProps: $Abstract<DefaultProps>;
  props: Props;
  state: $Abstract<State>;

  /**
   * Removes focus. This is the opposite of `focus()`.
   */
  blur(): void {
    TextInputState.blurTextInput(findNumericNodeHandle(this));
  }

  /**
   * Requests focus. The exact behavior depends on the platform and view.
   */
  focus(): void {
    TextInputState.focusTextInput(findNumericNodeHandle(this));
  }

  /**
   * Measures the on-screen location and dimensions. If successful, the callback
   * will be called asynchronously with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * These values are not available until after natives rendering completes. If
   * you need the measurements as soon as possible, consider using the
   * [`onLayout` prop](docs/view.html#onlayout) instead.
   */
  measure(callback: MeasureOnSuccessCallback): void {
    UIManager.measure(
      findNumericNodeHandle(this),
      mountSafeCallback(this, callback),
    );
  }

  /**
   * Measures the on-screen location and dimensions. Even if the React Native
   * root view is embedded within another native view, this method will give you
   * the absolute coordinates measured from the window. If successful, the
   * callback will be called asynchronously with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * These values are not available until after natives rendering completes.
   */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void {
    UIManager.measureInWindow(
      findNumericNodeHandle(this),
      mountSafeCallback(this, callback),
    );
  }

  /**
   * Similar to [`measure()`](#measure), but the resulting location will be
   * relative to the supplied ancestor's location.
   *
   * Obtain a native node handle with `ReactNative.findNodeHandle(component)`.
   */
  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ): void {
    UIManager.measureLayout(
      findNumericNodeHandle(this),
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess),
    );
  }

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](docs/direct-manipulation.html)).
   */
  setNativeProps(nativeProps: Object): void {
    injectedSetNativeProps(this, nativeProps);
  }
}

// eslint-disable-next-line no-unused-expressions
(ReactNativeComponent.prototype: NativeMethodsMixinType);

// TODO (bvaughn) Inline this once ReactNativeStack is dropped.
function setNativePropsFiber(componentOrHandle: any, nativeProps: Object) {
  // Class components don't have viewConfig -> validateAttributes.
  // Nor does it make sense to set native props on a non-native component.
  // Instead, find the nearest host component and set props on it.
  // Use findNodeHandle() rather than ReactNative.findNodeHandle() because
  // We want the instance/wrapper (not the native tag).
  let maybeInstance;

  // Fiber errors if findNodeHandle is called for an umounted component.
  // Tests using ReactTestRenderer will trigger this case indirectly.
  // Mimicking stack behavior, we should silently ignore this case.
  // TODO Fix ReactTestRenderer so we can remove this try/catch.
  try {
    maybeInstance = findNodeHandle(componentOrHandle);
  } catch (error) {}

  // If there is no host component beneath this we should fail silently.
  // This is not an error; it could mean a class component rendered null.
  if (maybeInstance == null) {
    return;
  }

  const viewConfig: ReactNativeBaseComponentViewConfig =
    maybeInstance.viewConfig;

  var updatePayload = ReactNativeAttributePayload.create(
    nativeProps,
    viewConfig.validAttributes,
  );

  UIManager.updateView(
    maybeInstance._nativeTag,
    viewConfig.uiViewClassName,
    updatePayload,
  );
}

// TODO (bvaughn) Remove this once ReactNativeStack is dropped.
function setNativePropsStack(componentOrHandle: any, nativeProps: Object) {
  // Class components don't have viewConfig -> validateAttributes.
  // Nor does it make sense to set native props on a non-native component.
  // Instead, find the nearest host component and set props on it.
  // Use findNodeHandle() rather than ReactNative.findNodeHandle() because
  // We want the instance/wrapper (not the native tag).
  let maybeInstance = findNodeHandle(componentOrHandle);

  // If there is no host component beneath this we should fail silently.
  // This is not an error; it could mean a class component rendered null.
  if (maybeInstance == null) {
    return;
  }

  let viewConfig: ReactNativeBaseComponentViewConfig;
  if (maybeInstance.viewConfig !== undefined) {
    // ReactNativeBaseComponent
    viewConfig = maybeInstance.viewConfig;
  } else if (
    maybeInstance._instance !== undefined &&
    maybeInstance._instance.viewConfig !== undefined
  ) {
    // ReactCompositeComponentWrapper
    // Some instances (eg Text) define their own viewConfig
    viewConfig = maybeInstance._instance.viewConfig;
  } else {
    // ReactCompositeComponentWrapper
    // Other instances (eg TextInput) defer to their children's viewConfig
    while (maybeInstance._renderedComponent !== undefined) {
      maybeInstance = maybeInstance._renderedComponent;
    }
    viewConfig = maybeInstance.viewConfig;
  }

  const tag: number = typeof maybeInstance.getHostNode === 'function'
    ? maybeInstance.getHostNode()
    : maybeInstance._rootNodeID;

  var updatePayload = ReactNativeAttributePayload.create(
    nativeProps,
    viewConfig.validAttributes,
  );

  UIManager.updateView(tag, viewConfig.uiViewClassName, updatePayload);
}

// Switching based on fiber vs stack to avoid a lot of inline checks at runtime.
// HACK Normally this injection would be done by the renderer, but in this case
// that would result in a cycle between ReactNative and NativeMethodsMixin.
// We avoid requiring additional code for this injection so it's probably ok?
// TODO (bvaughn) Remove this once ReactNativeStack is gone.
let injectedSetNativeProps: (
  componentOrHandle: any,
  nativeProps: Object,
) => void;
if (ReactNativeFeatureFlags.useFiber) {
  injectedSetNativeProps = setNativePropsFiber;
} else {
  injectedSetNativeProps = setNativePropsStack;
}

module.exports = ReactNativeComponent;
