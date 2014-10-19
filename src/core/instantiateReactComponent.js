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

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactNativeComponent = require('ReactNativeComponent');

var assign = require('Object.assign');
var invariant = require('invariant');
var warning = require('warning');

// To avoid a cyclic dependency, we create the final class in this module
var ReactCompositeComponentWrapper = function(inst) {
  this._instance = inst;
};
assign(
  ReactCompositeComponentWrapper.prototype,
  ReactCompositeComponent.Mixin,
  {
    _instantiateReactComponent: instantiateReactComponent
  }
);

/**
 * Check if the type reference is a known internal type. I.e. not a user
 * provided composite type.
 *
 * @param {function} type
 * @return {boolean} Returns true if this is a valid internal type.
 */
function isInternalComponentType(type) {
  return (
    typeof type === 'function' &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function'
  );
}

/**
 * Given a ReactNode, create an instance that will actually be mounted.
 *
 * @param {ReactNode} node
 * @param {*} parentCompositeType The composite type that resolved this.
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(node, parentCompositeType) {
  var instance;

  if (typeof node === 'object') {
    var element = node;
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
      // If the injected special class is not an internal class, but another
      // composite, then we must wrap it.
      // TODO: Move this resolution around to something cleaner.
      if (typeof instance.mountComponent !== 'function') {
        instance = new ReactCompositeComponentWrapper(instance);
      }
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // represenations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      instance = new element.type(element);
    } else {
      // TODO: Update to follow new ES6 initialization. Ideally, we can use
      // props in property initializers.
      var inst = new element.type(element.props);
      instance = new ReactCompositeComponentWrapper(inst);
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactNativeComponent.createInstanceForText(node);
  } else {
    invariant(
      false,
      'Encountered invalid React node of type ' + typeof node
    );
  }

  if (__DEV__) {
    warning(
      typeof instance.construct === 'function' &&
      typeof instance.mountComponent === 'function' &&
      typeof instance.receiveComponent === 'function' &&
      typeof instance.unmountComponent === 'function',
      'Only React Components can be mounted.'
    );
  }

  // Sets up the instance. This can probably just move into the constructor now.
  instance.construct(node);

  return instance;
}

module.exports = instantiateReactComponent;
