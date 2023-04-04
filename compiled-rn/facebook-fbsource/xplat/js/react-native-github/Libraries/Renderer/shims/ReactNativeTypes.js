/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {ElementRef, ElementType, Element, AbstractComponent} from 'react';

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

export type AttributeType<T, V> =
  | true
  | $ReadOnly<{
      diff?: (arg1: T, arg2: T) => boolean,
      process?: (arg1: V) => T,
    }>;

// We either force that `diff` and `process` always use mixed,
// or we allow them to define specific types and use this hack
export type AnyAttributeType = AttributeType<$FlowFixMe, $FlowFixMe>;

export type AttributeConfiguration = $ReadOnly<{
  [propName: string]: AnyAttributeType,
  style: $ReadOnly<{
    [propName: string]: AnyAttributeType,
    ...
  }>,
  ...
}>;

export type PartialAttributeConfiguration = $ReadOnly<{
  [propName: string]: AnyAttributeType,
  style?: $ReadOnly<{
    [propName: string]: AnyAttributeType,
    ...
  }>,
  ...
}>;

export type ViewConfig = $ReadOnly<{
  Commands?: $ReadOnly<{[commandName: string]: number, ...}>,
  Constants?: $ReadOnly<{[name: string]: mixed, ...}>,
  Manager?: string,
  NativeProps?: $ReadOnly<{[propName: string]: string, ...}>,
  baseModuleName?: ?string,
  bubblingEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{
      phasedRegistrationNames: $ReadOnly<{
        captured: string,
        bubbled: string,
        skipBubbling?: ?boolean,
      }>,
    }>,
    ...
  }>,
  directEventTypes?: $ReadOnly<{
    [eventName: string]: $ReadOnly<{
      registrationName: string,
    }>,
    ...
  }>,
  uiViewClassName: string,
  validAttributes: AttributeConfiguration,
}>;

export type PartialViewConfig = $ReadOnly<{
  bubblingEventTypes?: $PropertyType<ViewConfig, 'bubblingEventTypes'>,
  directEventTypes?: $PropertyType<ViewConfig, 'directEventTypes'>,
  uiViewClassName: string,
  validAttributes?: PartialAttributeConfiguration,
}>;

/**
 * Current usages should migrate to this definition
 */
export interface INativeMethods {
  blur(): void;
  focus(): void;
  measure(callback: MeasureOnSuccessCallback): void;
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void;
  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void;
  setNativeProps(nativeProps: {...}): void;
}

export type NativeMethods = $ReadOnly<{|
  blur(): void,
  focus(): void,
  measure(callback: MeasureOnSuccessCallback): void,
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void,
  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void,
  setNativeProps(nativeProps: {...}): void,
|}>;

// This validates that INativeMethods and NativeMethods stay in sync using Flow!
declare var ensureNativeMethodsAreSynced: NativeMethods;
(ensureNativeMethodsAreSynced: INativeMethods);

export type HostComponent<T> = AbstractComponent<T, $ReadOnly<NativeMethods>>;

type SecretInternalsType = {
  computeComponentStackForErrorReporting(tag: number): string,
  // TODO (bvaughn) Decide which additional types to expose here?
  // And how much information to fill in for the above types.
  ...
};

type InspectorDataProps = $ReadOnly<{
  [propName: string]: string,
  ...
}>;

type InspectorDataSource = $ReadOnly<{
  fileName?: string,
  lineNumber?: number,
}>;

type InspectorDataGetter = (
  <TElementType: ElementType>(
    componentOrHandle: ElementRef<TElementType> | number,
  ) => ?number,
) => $ReadOnly<{
  measure: (callback: MeasureOnSuccessCallback) => void,
  props: InspectorDataProps,
  source: InspectorDataSource,
}>;

export type InspectorData = $ReadOnly<{
  closestInstance?: mixed,
  hierarchy: Array<{
    name: ?string,
    getInspectorData: InspectorDataGetter,
  }>,
  selectedIndex: ?number,
  props: InspectorDataProps,
  source: ?InspectorDataSource,
}>;

export type TouchedViewDataAtPoint = $ReadOnly<{
  pointerY: number,
  touchedViewTag?: number,
  frame: $ReadOnly<{
    top: number,
    left: number,
    width: number,
    height: number,
  }>,
  ...InspectorData,
}>;

/**
 * Flat ReactNative renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeType = {
  findHostInstance_DEPRECATED<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?ElementRef<HostComponent<mixed>>,
  findNodeHandle<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?number,
  dispatchCommand(
    handle: ElementRef<HostComponent<mixed>>,
    command: string,
    args: Array<mixed>,
  ): void,
  sendAccessibilityEvent(
    handle: ElementRef<HostComponent<mixed>>,
    eventType: string,
  ): void,
  render(
    element: Element<ElementType>,
    containerTag: number,
    callback: ?() => void,
  ): ?ElementRef<ElementType>,
  unmountComponentAtNode(containerTag: number): void,
  unmountComponentAtNodeAndRemoveContainer(containerTag: number): void,
  unstable_batchedUpdates: <T>(fn: (T) => void, bookkeeping: T) => void,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: SecretInternalsType,
  ...
};

export opaque type Node = mixed;
export opaque type InternalInstanceHandle = mixed;
type PublicInstance = mixed;
type PublicTextInstance = mixed;

export type ReactFabricType = {
  findHostInstance_DEPRECATED<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?ElementRef<HostComponent<mixed>>,
  findNodeHandle<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?number,
  dispatchCommand(
    handle: ElementRef<HostComponent<mixed>>,
    command: string,
    args: Array<mixed>,
  ): void,
  sendAccessibilityEvent(
    handle: ElementRef<HostComponent<mixed>>,
    eventType: string,
  ): void,
  render(
    element: Element<ElementType>,
    containerTag: number,
    callback: ?() => void,
    concurrentRoot: ?boolean,
  ): ?ElementRef<ElementType>,
  unmountComponentAtNode(containerTag: number): void,
  getNodeFromInternalInstanceHandle(
    internalInstanceHandle: InternalInstanceHandle,
  ): ?Node,
  getPublicInstanceFromInternalInstanceHandle(
    internalInstanceHandle: InternalInstanceHandle,
  ): PublicInstance | PublicTextInstance,
  ...
};

export type ReactFabricEventTouch = {
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

export type ReactFabricEvent = {
  touches: Array<ReactFabricEventTouch>,
  changedTouches: Array<ReactFabricEventTouch>,
  targetTouches: Array<ReactFabricEventTouch>,
  target: number,
  ...
};

// Imperative LayoutAnimation API types
//
export type LayoutAnimationType =
  | 'spring'
  | 'linear'
  | 'easeInEaseOut'
  | 'easeIn'
  | 'easeOut'
  | 'keyboard';

export type LayoutAnimationProperty =
  | 'opacity'
  | 'scaleX'
  | 'scaleY'
  | 'scaleXY';

export type LayoutAnimationAnimationConfig = $ReadOnly<{
  duration?: number,
  delay?: number,
  springDamping?: number,
  initialVelocity?: number,
  type?: LayoutAnimationType,
  property?: LayoutAnimationProperty,
}>;

export type LayoutAnimationConfig = $ReadOnly<{
  duration: number,
  create?: LayoutAnimationAnimationConfig,
  update?: LayoutAnimationAnimationConfig,
  delete?: LayoutAnimationAnimationConfig,
}>;
