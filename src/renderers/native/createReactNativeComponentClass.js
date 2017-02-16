/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createReactNativeComponentClass
 * @flow
 */

'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const ReactNativeBaseComponent = require('ReactNativeBaseComponent');
const ReactNativeFeatureFlags = require('ReactNativeFeatureFlags');

// See also ReactNativeBaseComponent
export type NativeViewConfig = {
  propTypes?: Object,
  uiViewClassName: string,
  validAttributes: Object,
};

export type Instance = {
  _children: Array<Instance | number>,
  _nativeTag: number,
  viewConfig: NativeViewConfig,
};

// @TODO (bvaughn) Maybe move this somewhere?
function ReactNativeFiberHostComponent(
  viewConfig: NativeViewConfig
) {
  this.viewConfig = viewConfig;
}
Object.assign(
  ReactNativeFiberHostComponent.prototype,
  NativeMethodsMixin
);

/**
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeFiberComponentClass = function(
  viewConfig: NativeViewConfig
): Class<Instance> {
  function Constructor(nativeTag) {
    this._children = [];
    this._nativeTag = nativeTag;
  }
  Constructor.displayName = viewConfig.uiViewClassName;
  Constructor.viewConfig = viewConfig;
  Constructor.propTypes = viewConfig.propTypes;
  Constructor.prototype = new ReactNativeFiberHostComponent(viewConfig);
  Constructor.prototype.constructor = Constructor;

  // @TODO (bvaughn) This is temporary hack just to get things working.
  Constructor.__reactInternalHostComponentFlag = true;

  return ((Constructor: any): ReactClass<any>);
};

/**
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeComponentClass = function(
  viewConfig: NativeViewConfig
): ReactClass<any> {
  const Constructor = function(element) {
    this._currentElement = element;
    this._topLevelWrapper = null;
    this._hostParent = null;
    this._hostContainerInfo = null;
    this._rootNodeID = 0;
    this._renderedChildren = null;
  };
  Constructor.displayName = viewConfig.uiViewClassName;
  Constructor.viewConfig = viewConfig;
  Constructor.propTypes = viewConfig.propTypes;
  Constructor.prototype = new ReactNativeBaseComponent(viewConfig);
  Constructor.prototype.constructor = Constructor;

  return ((Constructor: any): ReactClass<any>);
};

module.exports = ReactNativeFeatureFlags.useFiber
  ? createReactNativeFiberComponentClass
  : createReactNativeComponentClass;
