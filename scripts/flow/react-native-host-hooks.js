/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

import type {
  MeasureOnSuccessCallback,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  ReactNativeBaseComponentViewConfig,
  ViewConfigGetter,
} from 'react-native-renderer/src/ReactNativeTypes';
import type {RNTopLevelEventType} from 'react-native-renderer/src/legacy-events/TopLevelEventTypes';
import type {CapturedError} from 'react-reconciler/src/ReactCapturedValue';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

type DeepDifferOptions = {|+unsafelyIgnoreFunctions?: boolean|};

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
    showErrorDialog: (error: CapturedError) => boolean,
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
  declare export var BatchedBridge: {
    registerCallableModule: (name: string, module: Object) => void,
    ...
  };
  declare export var ReactNativeViewConfigRegistry: {
    customBubblingEventTypes: Object,
    customDirectEventTypes: Object,
    eventTypes: Object,

    register: (name: string, callback: ViewConfigGetter) => string,
    get: (name: string) => ReactNativeBaseComponentViewConfig,
    ...
  };
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
      type: RNTopLevelEventType,
      payload: Object,
    ) => void,
  ) => void,

  dispatchCommand: (node: Object, command: string, args: Array<any>) => void,

  measure: (node: Node, callback: MeasureOnSuccessCallback) => void,
  measureInWindow: (
    node: Node,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void,
  measureLayout: (
    node: Node,
    relativeNode: Node,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void,
  findNodeAtPoint: (
    node: Node,
    locationX: number,
    locationY: number,
    callback: (Fiber) => void,
  ) => void,
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
