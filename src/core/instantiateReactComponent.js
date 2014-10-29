/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule instantiateReactComponent
 * @typechecks static-only
 */

"use strict";

var warning = require('warning');

var ReactElement = require('ReactElement');
var ReactNativeComponent = require('ReactNativeComponent');

// This is temporary until we've hidden all the implementation details
// TODO: Delete this hack once implementation details are hidden
var publicAPIs = {
  forceUpdate: true,
  replaceState: true,
  setProps: true,
  setState: true,
  getDOMNode: true
  // Public APIs used internally:
  // isMounted: true,
  // replaceProps: true,
};

function unmockImplementationDetails(mockInstance) {
  var ReactCompositeComponentBase = instantiateReactComponent._compositeBase;
  for (var key in ReactCompositeComponentBase.prototype) {
    if (!publicAPIs.hasOwnProperty(key)) {
      mockInstance[key] = ReactCompositeComponentBase.prototype[key];
    }
  }
}

/**
 * Given an `element` create an instance that will actually be mounted.
 *
 * @param {object} element
 * @param {*} parentCompositeType The composite type that resolved this.
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(element, parentCompositeType) {
  var instance;

  if (__DEV__) {
    warning(
      element && (typeof element.type === 'function' ||
                     typeof element.type === 'string'),
      'Only functions or strings can be mounted as React components.'
    );
  }

  // Special case string values
  if (typeof element.type === 'string') {
    instance = ReactNativeComponent.createInstanceForTag(
      element.type,
      element.props,
      parentCompositeType
    );
  } else {
    // Normal case for non-mocks and non-strings
    instance = new element.type(element.props);
  }

  if (__DEV__) {
    if (element.type._isMockFunction) {
      // TODO: Remove this special case
      unmockImplementationDetails(instance);
    }

    warning(
      typeof instance.construct === 'function' &&
      typeof instance.mountComponent === 'function' &&
      typeof instance.receiveComponent === 'function',
      'Only React Components can be mounted.'
    );
  }

  // This actually sets up the internal instance. This will become decoupled
  // from the public instance in a future diff.
  instance.construct(element);

  return instance;
}

module.exports = instantiateReactComponent;
