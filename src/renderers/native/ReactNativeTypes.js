/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeTypes
 * @flow
 */
'use strict';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

type BubblingEventType = {
  phasedRegistrationNames: {
    captured: string,
    bubbled: string,
  },
};

type DirectEventType = {
  registrationName: string,
};

export type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  bubblingEventTypes?: {[topLevelType: string]: BubblingEventType},
  directEventTypes?: {[topLevelType: string]: DirectEventType},
  propTypes?: Object,
};

export type ViewConfigGetter = () => ReactNativeBaseComponentViewConfig;

/**
 * This type keeps ReactNativeFiberHostComponent and NativeMethodsMixin in sync.
 * It can also provide types for ReactNative applications that use NMM or refs.
 */
export type NativeMethodsMixinType = {
  blur(): void,
  focus(): void,
  measure(callback: MeasureOnSuccessCallback): void,
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void,
  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void,
  ): void,
  setNativeProps(nativeProps: Object): void,
};

type ReactNativeBridgeEventPlugin = {
  processEventTypes(viewConfig: ReactNativeBaseComponentViewConfig): void,
};

type SecretInternalsType = {
  NativeMethodsMixin: NativeMethodsMixinType,
  createReactNativeComponentClass(
    name: string,
    callback: ViewConfigGetter,
  ): any,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin,
  ReactNativeComponentTree: any,
  ReactNativePropRegistry: any,
  // TODO (bvaughn) Decide which additional types to expose here?
  // And how much information to fill in for the above types.
};

/**
 * Flat ReactNative renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeType = {
  NativeComponent: any,
  findNodeHandle(componentOrHandle: any): ?number,
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,
  unmountComponentAtNodeAndRemoveContainer(containerTag: number): any,
  unstable_batchedUpdates: any, // TODO (bvaughn) Add types

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: SecretInternalsType,
};
