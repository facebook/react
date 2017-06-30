/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable */

declare module 'deepDiffer' {
  declare function exports(one: any, two: any): bool;
}
declare module 'deepFreezeAndThrowOnMutationInDev' {
  declare function exports<T>(obj : T) : T;
}
declare module 'flattenStyle' { }
declare module 'InitializeCore' { }
declare module 'RCTEventEmitter' {
  declare function register(mixed) : void;
}
declare module 'TextInputState' {
  declare function blurTextInput(object : any) : void;
  declare function focusTextInput(object : any) : void;
}
declare module 'ExceptionsManager' {
  declare function handleException(
    error: Error,
    isFatal: boolean,
  ) : void;
}
declare module 'UIManager' {
  declare var customBubblingEventTypes : Object;
  declare var customDirectEventTypes : Object;
  declare function createView(
    reactTag : number,
    viewName : string,
    rootTag : number,
    props : ?Object,
  ) : void;
  declare function manageChildren(
    containerTag : number,
    moveFromIndices : Array<number>,
    moveToIndices : Array<number>,
    addChildReactTags : Array<number>,
    addAtIndices : Array<number>,
    removeAtIndices : Array<number>
  ) : void;
  declare function measure(hostComponent: mixed, callback: Function) : void;
  declare function measureInWindow(
    nativeTag : ?number,
    callback : Function
  ) : void;
  declare function measureLayout(
    nativeTag : mixed,
    nativeNode : number,
    onFail : Function,
    onSuccess : Function
  ) : void;
  declare function removeRootView(containerTag : number) : void;
  declare function removeSubviewsFromContainerWithID(containerId : number) : void;
  declare function replaceExistingNonRootView() : void;
  declare function setChildren(
    containerTag : number,
    reactTags : Array<number>,
  ) : void;
  declare function updateView(
    reactTag : number,
    viewName : string,
    props : ?Object,
  ) : void;
  declare function __takeSnapshot(
    view ?: 'window' | Element<any> | number,
    options ?: {
       width ?: number,
       height ?: number,
       format ?: 'png' | 'jpeg',
       quality ?: number,
    },
  ) : Promise<any>;
}
declare module 'View' {
  declare var exports : typeof ReactComponent;
}
