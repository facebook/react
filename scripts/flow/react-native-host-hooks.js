/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

// libdefs cannot actually import. These are supposed to be the types imported
// from 'react-native-renderer/src/ReactNativeTypes'
type __MeasureOnSuccessCallback = any;
type __MeasureInWindowOnSuccessCallback = any;
type __MeasureLayoutOnSuccessCallback = any;
type __ReactNativeBaseComponentViewConfig = any;
type __ViewConfigGetter = any;
type __ViewConfig = any;

// libdefs cannot actually import. This is supposed to be the type imported
// from 'react-native-renderer/src/legacy-events/TopLevelEventTypes';
type __RNTopLevelEventType = any;

// libdefs cannot actually import. This is supposed to be the type imported
// from 'react-reconciler/src/ReactCapturedValue'
type __CapturedError = any;

type DeepDifferOptions = {+unsafelyIgnoreFunctions?: boolean};
type RawEventEmitterEvent = $ReadOnly<{
  eventName: string,
  // We expect, but do not/cannot require, that nativeEvent is an object
  // with the properties: key, elementType (string), type (string), tag (numeric),
  // and a stateNode of the native element/Fiber the event was emitted to.
  nativeEvent: {[string]: mixed, ...},
}>;

declare module 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface' {
  declare export function deepDiffer(
    one: any,
    two: any,
    maxDepth?: number,
    options?: DeepDifferOptions,
  ): boolean;
  declare export function deepDiffer(
    one: any,
    two: any,
    options: DeepDifferOptions,
  ): boolean;
  declare export function deepFreezeAndThrowOnMutationInDev<T>(obj: T): T;
  declare export function flattenStyle(style: any): any;
  declare export var RCTEventEmitter: {
    register: (eventEmitter: mixed) => void,
    ...
  };
  declare export var TextInputState: {
    blurTextInput: (object: any) => void,
    focusTextInput: (object: any) => void,
    ...
  };
  declare export var ReactFiberErrorDialog: {
    showErrorDialog: (error: __CapturedError) => boolean,
    ...
  };
  declare export var Platform: {OS: string, ...};
  declare export var UIManager: {
    customBubblingEventTypes: Object,
    customDirectEventTypes: Object,
    createView: (
      reactTag: number,
      viewName: string,
      rootTag: number,
      props: ?Object,
    ) => void,
    dispatchViewManagerCommand: (
      reactTag: number,
      command: string,
      args: Array<any>,
    ) => void,
    manageChildren: (
      containerTag: number,
      moveFromIndices: Array<number>,
      moveToIndices: Array<number>,
      addChildReactTags: Array<number>,
      addAtIndices: Array<number>,
      removeAtIndices: Array<number>,
    ) => void,
    measure: (hostComponent: mixed, callback: Function) => void,
    measureInWindow: (nativeTag: ?number, callback: Function) => void,
    measureLayout: (
      nativeTag: mixed,
      nativeNode: number,
      onFail: Function,
      onSuccess: Function,
    ) => void,
    removeRootView: (containerTag: number) => void,
    removeSubviewsFromContainerWithID: (containerId: number) => void,
    replaceExistingNonRootView: () => void,
    setChildren: (containerTag: number, reactTags: Array<number>) => void,
    updateView: (reactTag: number, viewName: string, props: ?Object) => void,
    __takeSnapshot: (
      view?: 'window' | Element<any> | number,
      options?: {
        width?: number,
        height?: number,
        format?: 'png' | 'jpeg',
        quality?: number,
        ...
      },
    ) => Promise<any>,
    setJSResponder: (reactTag: number, blockNativeResponder: boolean) => void,
    clearJSResponder: () => void,
    findSubviewIn: (
      reactTag: ?number,
      point: Array<number>,
      callback: (
        nativeViewTag: number,
        left: number,
        top: number,
        width: number,
        height: number,
      ) => void,
    ) => void,
    ...
  };
  declare export var legacySendAccessibilityEvent: (
    reactTag: number,
    eventTypeName: string,
  ) => void;
  declare export var BatchedBridge: {
    registerCallableModule: (name: string, module: Object) => void,
    ...
  };
  declare export var ReactNativeViewConfigRegistry: {
    customBubblingEventTypes: Object,
    customDirectEventTypes: Object,
    eventTypes: Object,

    register: (name: string, callback: __ViewConfigGetter) => string,
    get: (name: string) => __ReactNativeBaseComponentViewConfig,
    ...
  };
  declare export var RawEventEmitter: {
    emit: (channel: string, event: RawEventEmitterEvent) => string,
    ...
  };
  declare export opaque type PublicInstance;
  declare export opaque type PublicTextInstance;
  declare export function getNodeFromPublicInstance(
    publicInstance: PublicInstance,
  ): Object;
  declare export function getNativeTagFromPublicInstance(
    publicInstance: PublicInstance,
  ): number;
  declare export function createPublicInstance(
    tag: number,
    viewConfig: __ViewConfig,
    internalInstanceHandle: mixed,
  ): PublicInstance;
  declare export function createPublicTextInstance(
    internalInstanceHandle: mixed,
  ): PublicTextInstance;
}

declare module 'react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore' {
}

// This is needed for a short term solution.
// See https://github.com/facebook/react/pull/15490 for more info
declare var nativeFabricUIManager: {
  createNode: (
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: ?Object,
    eventTarget: Object,
  ) => Object,
  cloneNode: (node: Object) => Object,
  cloneNodeWithNewChildren: (node: Object) => Object,
  cloneNodeWithNewProps: (node: Object, newProps: ?Object) => Object,
  cloneNodeWithNewChildrenAndProps: (node: Object, newProps: ?Object) => Object,
  appendChild: (node: Object, childNode: Object) => void,

  createChildSet: (rootTag: number) => Object,
  appendChildToSet: (childSet: Object, childNode: Object) => void,
  completeRoot: (rootTag: number, childSet: Object) => void,
  registerEventHandler: (
    callback: (
      eventTarget: null | Object,
      type: __RNTopLevelEventType,
      payload: Object,
    ) => void,
  ) => void,
  setNativeProps: (node: Object, nativeProps: Object) => Object,
  dispatchCommand: (node: Object, command: string, args: Array<any>) => void,
  sendAccessibilityEvent: (node: Object, eventTypeName: string) => void,

  measure: (node: Object, callback: __MeasureOnSuccessCallback) => void,
  measureInWindow: (
    node: Object,
    callback: __MeasureInWindowOnSuccessCallback,
  ) => void,
  measureLayout: (
    node: Object,
    relativeNode: Object,
    onFail: () => void,
    onSuccess: __MeasureLayoutOnSuccessCallback,
  ) => void,
  getBoundingClientRect: (
    node: Object,
  ) => [
    /* x:*/ number,
    /* y:*/ number,
    /* width:*/ number,
    /* height:*/ number,
  ],
  findNodeAtPoint: (
    node: Object,
    locationX: number,
    locationY: number,
    callback: (Object) => void,
  ) => void,
  setIsJSResponder: (
    node: Object,
    isJsResponder: boolean,
    blockNativeResponder: boolean,
  ) => void,
  unstable_DefaultEventPriority: number,
  unstable_DiscreteEventPriority: number,
  unstable_getCurrentEventPriority: () => number,
  ...
};

declare module 'View' {
  declare module.exports: typeof React$Component;
}

declare module 'RTManager' {
  declare function createNode(
    tag: number,
    classType: string,
    props: ?Object,
  ): void;

  declare function beginUpdates(): void;

  declare function appendChildToContext(
    contextTag: number,
    childTag: number,
  ): void;
  declare function appendChild(parentTag: number, childTag: number): void;
  declare function prependChild(childTag: number, beforeTag: number): void;
  declare function deleteChild(childTag: number): void;
  declare function updateNode(tag: number, props: ?Object): void;

  declare function completeUpdates(): void;
}

// shims/ReactFeatureFlags is generated by the packaging script
declare module '../shims/ReactFeatureFlags' {
  declare export var debugRenderPhaseSideEffects: boolean;
}
