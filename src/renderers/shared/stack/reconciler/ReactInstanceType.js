 /**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ReactInstanceType
 */

'use strict';

export type DebugID = number;

export type ReactInstance = {
  // ReactCompositeComponent
  mountComponent: any,
  performInitialMountWithErrorHandling: any,
  performInitialMount: any,
  getHostNode: any,
  unmountComponent: any,
  receiveComponent: any,
  performUpdateIfNecessary: any,
  updateComponent: any,
  attachRef: (ref: string, component: ReactInstance) => void,
  detachRef: (ref: string) => void,
  getName: () => string,
  getPublicInstance: any,
  _rootNodeID: number,

  // ReactDOMComponent
  _tag: string,

  // instantiateReactComponent
  _mountIndex: number,
  _mountImage: any,
  // __DEV__
  _debugID: DebugID,
  _warnedAboutRefsInRender: boolean,
};
