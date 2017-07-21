/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInstanceType
 * @flow
 */

'use strict';

import type {ReactElement} from 'ReactElementType';
import type {CompositeComponentTypes} from 'ReactCompositeComponentTypes';

export type DebugID = number;

export type ReactInstance = {
  // Shared
  mountComponent: any,
  unmountComponent: any,
  receiveComponent: any,
  getName: () => string,
  getPublicInstance: any,
  _currentElement: ReactElement,

  // ReactCompositeComponent
  performInitialMountWithErrorHandling: any,
  performInitialMount: any,
  getHostNode: any,
  performUpdateIfNecessary: any,
  updateComponent: any,
  attachRef: (ref: string, component: ReactInstance) => void,
  detachRef: (ref: string) => void,
  _rootNodeID: number,
  _compositeType: CompositeComponentTypes,

  // ReactDOMComponent
  _tag: string,

  // instantiateReactComponent
  _mountIndex: number,
  _mountImage: any,
  // __DEV__
  _debugID: DebugID,
  _warnedAboutRefsInRender: boolean,
};
