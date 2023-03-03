/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {ElementRef} from 'react';
import type {
  ViewConfig,
  NativeMethods,
  HostComponent,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from './ReactNativeTypes';

import {TextInputState} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import {create} from './ReactNativeAttributePayload';

import {warnForStyleProps} from './NativeMethodsMixinUtils';

const {
  measure: fabricMeasure,
  measureInWindow: fabricMeasureInWindow,
  measureLayout: fabricMeasureLayout,
  setNativeProps,
  getBoundingClientRect: fabricGetBoundingClientRect,
} = nativeFabricUIManager;

const noop = () => {};

type ParamOf<Fn> = $Call<<T>((arg: T) => mixed) => T, Fn>;
type ShadowNode = ParamOf<typeof fabricMeasure>;

/**
 * This is used for refs on host components.
 */
export class ReactFabricHostComponent implements NativeMethods {
  // The native tag has to be accessible in `ReactFabricHostComponentUtils`.
  __nativeTag: number;

  _viewConfig: ViewConfig;
  _internalInstanceHandle: mixed;

  constructor(
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandle: mixed,
  ) {
    this.__nativeTag = tag;
    this._viewConfig = viewConfig;
    this._internalInstanceHandle = internalInstanceHandle;
  }

  blur() {
    TextInputState.blurTextInput(this);
  }

  focus() {
    TextInputState.focusTextInput(this);
  }

  measure(callback: MeasureOnSuccessCallback) {
    const node = getShadowNodeFromInternalInstanceHandle(
      this._internalInstanceHandle,
    );
    if (node != null) {
      fabricMeasure(node, callback);
    }
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    const node = getShadowNodeFromInternalInstanceHandle(
      this._internalInstanceHandle,
    );
    if (node != null) {
      fabricMeasureInWindow(node, callback);
    }
  }

  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    if (
      typeof relativeToNativeNode === 'number' ||
      !(relativeToNativeNode instanceof ReactFabricHostComponent)
    ) {
      if (__DEV__) {
        console.error(
          'Warning: ref.measureLayout must be called with a ref to a native component.',
        );
      }

      return;
    }

    const toStateNode = getShadowNodeFromInternalInstanceHandle(
      this._internalInstanceHandle,
    );
    const fromStateNode = getShadowNodeFromInternalInstanceHandle(
      relativeToNativeNode._internalInstanceHandle,
    );

    if (toStateNode != null && fromStateNode != null) {
      fabricMeasureLayout(
        toStateNode,
        fromStateNode,
        onFail != null ? onFail : noop,
        onSuccess != null ? onSuccess : noop,
      );
    }
  }

  unstable_getBoundingClientRect(): DOMRect {
    const node = getShadowNodeFromInternalInstanceHandle(
      this._internalInstanceHandle,
    );
    if (node != null) {
      const rect = fabricGetBoundingClientRect(node);

      if (rect) {
        return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
      }
    }

    // Empty rect if any of the above failed
    return new DOMRect(0, 0, 0, 0);
  }

  setNativeProps(nativeProps: {...}): void {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this._viewConfig.validAttributes);
    }
    const updatePayload = create(nativeProps, this._viewConfig.validAttributes);

    const node = getShadowNodeFromInternalInstanceHandle(
      this._internalInstanceHandle,
    );
    if (node != null && updatePayload != null) {
      setNativeProps(node, updatePayload);
    }
  }
}

function getShadowNodeFromInternalInstanceHandle(
  internalInstanceHandle: mixed,
): ?ShadowNode {
  // $FlowExpectedError[incompatible-use] internalInstanceHandle is opaque but we need to make an exception here.
  return internalInstanceHandle?.stateNode?.node;
}

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: mixed,
): ReactFabricHostComponent {
  return new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
}
