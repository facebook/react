/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethodsMixinType,
  ReactNativeBaseComponentViewConfig,
} from './ReactNativeTypes';

import React from 'react';
// Modules provided by RN:
import {
  TextInputState,
  UIManager,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {create} from './ReactNativeAttributePayload';
import {mountSafeCallback_NOT_REALLY_SAFE} from './NativeMethodsMixinUtils';

import warningWithoutStack from 'shared/warningWithoutStack';
import {warnAboutDeprecatedSetNativeProps} from 'shared/ReactFeatureFlags';

export default function(
  findNodeHandle: any => ?number,
  findHostInstance: any => any,
) {
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
  class ReactNativeComponent<Props, State = void> extends React.Component<
    Props,
    State,
  > {
    /**
     * Due to bugs in Flow's handling of React.createClass, some fields already
     * declared in the base class need to be redeclared below.
     */
    props: Props;
    state: State;

    /**
     * Removes focus. This is the opposite of `focus()`.
     */
    blur(): void {
      TextInputState.blurTextInput(findNodeHandle(this));
    }

    /**
     * Requests focus. The exact behavior depends on the platform and view.
     */
    focus(): void {
      TextInputState.focusTextInput(findNodeHandle(this));
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
      let maybeInstance;

      // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.
      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {}

      // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.
      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        // We can't call FabricUIManager here because it won't be loaded in paper
        // at initialization time. See https://github.com/facebook/react/pull/15490
        // for more info.
        nativeFabricUIManager.measure(
          maybeInstance.node,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback),
        );
      } else {
        UIManager.measure(
          findNodeHandle(this),
          mountSafeCallback_NOT_REALLY_SAFE(this, callback),
        );
      }
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
      let maybeInstance;

      // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.
      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {}

      // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.
      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        // We can't call FabricUIManager here because it won't be loaded in paper
        // at initialization time. See https://github.com/facebook/react/pull/15490
        // for more info.
        nativeFabricUIManager.measureInWindow(
          maybeInstance.node,
          mountSafeCallback_NOT_REALLY_SAFE(this, callback),
        );
      } else {
        UIManager.measureInWindow(
          findNodeHandle(this),
          mountSafeCallback_NOT_REALLY_SAFE(this, callback),
        );
      }
    }

    /**
     * Similar to [`measure()`](#measure), but the resulting location will be
     * relative to the supplied ancestor's location.
     *
     * Obtain a native node handle with `ReactNative.findNodeHandle(component)`.
     */
    measureLayout(
      relativeToNativeNode: number | Object,
      onSuccess: MeasureLayoutOnSuccessCallback,
      onFail: () => void /* currently unused */,
    ): void {
      let maybeInstance;

      // Fiber errors if findNodeHandle is called for an umounted component.
      // Tests using ReactTestRenderer will trigger this case indirectly.
      // Mimicking stack behavior, we should silently ignore this case.
      // TODO Fix ReactTestRenderer so we can remove this try/catch.
      try {
        maybeInstance = findHostInstance(this);
      } catch (error) {}

      // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.
      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        warningWithoutStack(
          false,
          'Warning: measureLayout on components using NativeMethodsMixin ' +
            'or ReactNative.NativeComponent is not currently supported in Fabric. ' +
            'measureLayout must be called on a native ref. Consider using forwardRef.',
        );
        return;
      } else {
        let relativeNode;

        if (typeof relativeToNativeNode === 'number') {
          // Already a node handle
          relativeNode = relativeToNativeNode;
        } else if (relativeToNativeNode._nativeTag) {
          relativeNode = relativeToNativeNode._nativeTag;
        }

        if (relativeNode == null) {
          warningWithoutStack(
            false,
            'Warning: ref.measureLayout must be called with a node handle or a ref to a native component.',
          );

          return;
        }

        UIManager.measureLayout(
          findNodeHandle(this),
          relativeNode,
          mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
          mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess),
        );
      }
    }

    /**
     * This function sends props straight to native. They will not participate in
     * future diff process - this means that if you do not include them in the
     * next render, they will remain active (see [Direct
     * Manipulation](docs/direct-manipulation.html)).
     */
    setNativeProps(nativeProps: Object): void {
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
        maybeInstance = findHostInstance(this);
      } catch (error) {}

      // If there is no host component beneath this we should fail silently.
      // This is not an error; it could mean a class component rendered null.
      if (maybeInstance == null) {
        return;
      }

      if (maybeInstance.canonical) {
        warningWithoutStack(
          false,
          'Warning: setNativeProps is not currently supported in Fabric',
        );
        return;
      }

      if (__DEV__) {
        if (warnAboutDeprecatedSetNativeProps) {
          warningWithoutStack(
            false,
            'Warning: Calling ref.setNativeProps(nativeProps) ' +
              'is deprecated and will be removed in a future release. ' +
              'Use the setNativeProps export from the react-native package instead.' +
              "\n\timport {setNativeProps} from 'react-native';\n\tsetNativeProps(ref, nativeProps);\n",
          );
        }
      }

      const nativeTag =
        maybeInstance._nativeTag || maybeInstance.canonical._nativeTag;
      const viewConfig: ReactNativeBaseComponentViewConfig<> =
        maybeInstance.viewConfig || maybeInstance.canonical.viewConfig;

      const updatePayload = create(nativeProps, viewConfig.validAttributes);

      // Avoid the overhead of bridge calls if there's no update.
      // This is an expensive no-op for Android, and causes an unnecessary
      // view invalidation for certain components (eg RCTTextInput) on iOS.
      if (updatePayload != null) {
        UIManager.updateView(
          nativeTag,
          viewConfig.uiViewClassName,
          updatePayload,
        );
      }
    }
  }

  // eslint-disable-next-line no-unused-expressions
  (ReactNativeComponent.prototype: NativeMethodsMixinType);

  return ReactNativeComponent;
}
