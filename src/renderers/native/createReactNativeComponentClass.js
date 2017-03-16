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

const ReactNativeBaseComponent = require('ReactNativeBaseComponent');
const ReactNativeFeatureFlags = require('ReactNativeFeatureFlags');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

// See also ReactNativeBaseComponent
type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object,
  uiViewClassName: string,
  propTypes?: Object,
};

/**
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeFiberComponentClass = function(
  viewConfig: ReactNativeBaseComponentViewConfig,
): string {
  return ReactNativeViewConfigRegistry.register(viewConfig);
};

/**
 * @param {string} config iOS View configuration.
 * @private
 */
const createReactNativeComponentClass = function(
  viewConfig: ReactNativeBaseComponentViewConfig,
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
