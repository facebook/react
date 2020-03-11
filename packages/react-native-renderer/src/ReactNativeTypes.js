/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {ElementRef, AbstractComponent} from 'react';

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

type AttributeType =
  | true
  | $ReadOnly<{|
      diff?: <T>(arg1: T, arg2: T) => boolean,
      process?: (arg1: any) => any,
    |}>;

export type AttributeConfiguration<
  TProps = string,
  TStyleProps = string,
> = $ReadOnly<{
  [propName: TProps]: AttributeType,
  style: $ReadOnly<{[propName: TStyleProps]: AttributeType, ...}>,
  ...
}>;

export type ReactNativeBaseComponentViewConfig<
  TProps = string,
  TStyleProps = string,
> = $ReadOnly<{|
  baseModuleName?: string,
  bubblingEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      phasedRegistrationNames: $ReadOnly<{|
        captured: string,
        bubbled: string,
      |}>,
    |}>,
    ...,
  }>,
  Commands?: $ReadOnly<{[commandName: string]: number, ...}>,
  directEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{|
      registrationName: string,
    |}>,
    ...,
  }>,
  NativeProps?: $ReadOnly<{[propName: string]: string, ...}>,
  uiViewClassName: string,
  validAttributes: AttributeConfiguration<TProps, TStyleProps>,
|}>;

export type ViewConfigGetter = () => ReactNativeBaseComponentViewConfig<>;

export type NativeMethods = {
  blur(): void,
  focus(): void,
  measure(callback: MeasureOnSuccessCallback): void,
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void,
  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void,
  setNativeProps(nativeProps: Object): void,
  ...
};

export type HostComponent<T> = AbstractComponent<T, $ReadOnly<NativeMethods>>;

type SecretInternalsType = {
  computeComponentStackForErrorReporting(tag: number): string,
  // TODO (bvaughn) Decide which additional types to expose here?
  // And how much information to fill in for the above types.
  ...
};

/**
 * Flat ReactNative renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeType = {
  findHostInstance_DEPRECATED(
    componentOrHandle: any,
  ): ?ElementRef<HostComponent<mixed>>,
  findNodeHandle(componentOrHandle: any): ?number,
  dispatchCommand(handle: any, command: string, args: Array<any>): void,
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,
  unmountComponentAtNodeAndRemoveContainer(containerTag: number): any,
  // TODO (bvaughn) Add types
  unstable_batchedUpdates: any,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: SecretInternalsType,
  ...
};

export type ReactFabricType = {
  findHostInstance_DEPRECATED(
    componentOrHandle: any,
  ): ?ElementRef<HostComponent<mixed>>,
  findNodeHandle(componentOrHandle: any): ?number,
  dispatchCommand(handle: any, command: string, args: Array<any>): void,
  render(
    element: React$Element<any>,
    containerTag: any,
    callback: ?Function,
  ): any,
  unmountComponentAtNode(containerTag: number): any,
  ...
};

export type ReactNativeEventTarget = {
  node: Object,
  canonical: {
    _nativeTag: number,
    viewConfig: ReactNativeBaseComponentViewConfig<>,
    currentProps: Object,
    _internalInstanceHandle: Object,
    ...
  },
  ...
};

export type ReactFaricEventTouch = {
  identifier: number,
  locationX: number,
  locationY: number,
  pageX: number,
  pageY: number,
  screenX: number,
  screenY: number,
  target: number,
  timestamp: number,
  force: number,
  ...
};

export type ReactFaricEvent = {
  touches: Array<ReactFaricEventTouch>,
  changedTouches: Array<ReactFaricEventTouch>,
  targetTouches: Array<ReactFaricEventTouch>,
  target: number,
  ...
};
