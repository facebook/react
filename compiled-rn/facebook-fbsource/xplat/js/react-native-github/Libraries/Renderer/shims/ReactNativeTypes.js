/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noformat
 * @nolint
 * @flow strict
 * @generated SignedSource<<2264e9839602043a41f1e13913b43b0f>>
 */

import type {
  Component as ReactComponent,
  ElementRef,
  ElementType,
  MixedElement,
} from 'react';
import type {
  // $FlowFixMe[nonstrict-import] TODO(@rubennorte)
  MeasureOnSuccessCallback,
  // $FlowFixMe[nonstrict-import] TODO(@rubennorte)
  PublicInstance,
  // $FlowFixMe[nonstrict-import] TODO(@rubennorte)
  PublicRootInstance,
  // $FlowFixMe[nonstrict-import] TODO(@rubennorte)
  PublicTextInstance,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

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
  supportsRawText?: boolean,
  uiViewClassName: string,
  validAttributes: AttributeConfiguration,
}>;

export type PartialViewConfig = $ReadOnly<{
  bubblingEventTypes?: ViewConfig['bubblingEventTypes'],
  directEventTypes?: ViewConfig['directEventTypes'],
  supportsRawText?: boolean,
  uiViewClassName: string,
  validAttributes?: PartialAttributeConfiguration,
}>;

type InspectorDataProps = $ReadOnly<{
  [propName: string]: string,
  ...
}>;

type InspectorDataGetter = (
  <TElementType: ElementType>(
    componentOrHandle: ElementRef<TElementType> | number,
  ) => ?number,
) => $ReadOnly<{
  measure: (callback: MeasureOnSuccessCallback) => void,
  props: InspectorDataProps,
}>;

export type InspectorData = $ReadOnly<{
  closestInstance?: mixed,
  hierarchy: Array<{
    name: ?string,
    getInspectorData: InspectorDataGetter,
  }>,
  selectedIndex: ?number,
  props: InspectorDataProps,
  componentStack: string,
}>;

export type TouchedViewDataAtPoint = $ReadOnly<
  {
    pointerY: number,
    touchedViewTag?: number,
    frame: $ReadOnly<{
      top: number,
      left: number,
      width: number,
      height: number,
    }>,
    closestPublicInstance?: PublicInstance,
  } & InspectorData,
>;

export type RenderRootOptions = {
  onUncaughtError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError?: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      // $FlowFixMe[unclear-type] unknown props and state.
      // $FlowFixMe[value-as-type] Component in react repo is any-typed, but it will be well typed externally.
      +errorBoundary?: ?ReactComponent<any, any>,
    },
  ) => void,
  onRecoverableError?: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
};

/**
 * Flat ReactNative renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level RN API and call it a day.
 */
export type ReactNativeType = {
  findHostInstance_DEPRECATED<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?PublicInstance,
  findNodeHandle<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?number,
  isChildPublicInstance(parent: PublicInstance, child: PublicInstance): boolean,
  dispatchCommand(
    handle: PublicInstance,
    command: string,
    args: Array<mixed>,
  ): void,
  sendAccessibilityEvent(handle: PublicInstance, eventType: string): void,
  render(
    element: MixedElement,
    containerTag: number,
    callback: ?() => void,
    options: ?RenderRootOptions,
  ): ?ElementRef<ElementType>,
  unmountComponentAtNode(containerTag: number): void,
  unmountComponentAtNodeAndRemoveContainer(containerTag: number): void,
  +unstable_batchedUpdates: <T>(fn: (T) => void, bookkeeping: T) => void,
  ...
};

export opaque type Node = mixed;
export opaque type InternalInstanceHandle = mixed;

export type ReactFabricType = {
  findHostInstance_DEPRECATED<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?PublicInstance,
  findNodeHandle<TElementType: ElementType>(
    componentOrHandle: ?(ElementRef<TElementType> | number),
  ): ?number,
  dispatchCommand(
    handle: PublicInstance,
    command: string,
    args: Array<mixed>,
  ): void,
  isChildPublicInstance(parent: PublicInstance, child: PublicInstance): boolean,
  sendAccessibilityEvent(handle: PublicInstance, eventType: string): void,
  render(
    element: MixedElement,
    containerTag: number,
    callback: ?() => void,
    concurrentRoot: ?boolean,
    options: ?RenderRootOptions,
  ): ?ElementRef<ElementType>,
  unmountComponentAtNode(containerTag: number): void,
  getNodeFromInternalInstanceHandle(
    internalInstanceHandle: InternalInstanceHandle,
  ): ?Node,
  getPublicInstanceFromInternalInstanceHandle(
    internalInstanceHandle: InternalInstanceHandle,
  ): PublicInstance | PublicTextInstance | null,
  getPublicInstanceFromRootTag(rootTag: number): PublicRootInstance | null,
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
