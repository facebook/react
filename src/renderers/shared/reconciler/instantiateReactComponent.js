/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule instantiateReactComponent
 * @typechecks static-only
 */

'use strict';

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactNativeComponent = require('ReactNativeComponent');
var ReactStatelessComponent = require('ReactStatelessComponent');

var assign = require('Object.assign');
var invariant = require('invariant');
var warning = require('warning');

// To avoid a cyclic dependency, we create the final class in this module
var ReactCompositeComponentWrapper = function() { };
assign(
  ReactCompositeComponentWrapper.prototype,
  ReactCompositeComponent.Mixin,
  {
    _instantiateReactComponent: instantiateReactComponent,
  }
);
var ReactStatelessOrCompositeComponentWrapper = function() { };
assign(
  ReactStatelessOrCompositeComponentWrapper.prototype,
  ReactCompositeComponent.Mixin,
  {
    _instantiateReactComponent: instantiateReactComponent,

    construct: function(element) {
      ReactCompositeComponent.Mixin.construct.call(this, element);
      this._stateless = false;
    },

    mountComponent: function(rootID, transaction, context) {
      // Will return false if element isn't composite
      var result = ReactCompositeComponent.Mixin.mountComponent.call(this, rootID, transaction, context);

      if (!result) {
        this._stateless = true;
        // Will throw error if element isn't stateless
        result = ReactStatelessComponent.Mixin.mountComponent.call(this, rootID, transaction, context);
      }

      return result;
    },

    receiveComponent: function(nextElement, transaction, nextContext) {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin.receiveComponent.call(this, nextElement, transaction, nextContext);
      } else {
        return ReactCompositeComponent.Mixin.receiveComponent.call(this, nextElement, transaction, nextContext);
      }
    },

    unmountComponent: function() {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin.unmountComponent.call(this);
      } else {
        return ReactCompositeComponent.Mixin.unmountComponent.call(this);
      }
    },

    performUpdateIfNecessary: function(transaction) {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin.performUpdateIfNecessary.call(this, transaction);
      } else {
        return ReactCompositeComponent.Mixin.performUpdateIfNecessary.call(this, transaction);
      }
    },

    getName: function() {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin.getName.call(this);
      } else {
        return ReactCompositeComponent.Mixin.getName.call(this);
      }
    },

    updateComponent: function(a, b, c, d, e) {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin.updateComponent.call(this, a, b, c, d, e);
      } else {
        return ReactCompositeComponent.Mixin.updateComponent.call(this, a, b, c, d, e);
      }
    },

    _renderValidatedComponent: function() {
      if (this._stateless) {
        return ReactStatelessComponent.Mixin._renderValidatedComponent.call(this);
      } else {
        return ReactCompositeComponent.Mixin._renderValidatedComponent.call(this);
      }
    },
  }
)

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
    typeof type.prototype !== 'undefined' &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function'
  );
}

/**
 * Check if the type reference is a stateless function type.
 *
 * @param {function} type
 * @return {boolean} Returns true if this is a stateless function type.
 */
function isPropablyStatelessComponentType(type) {
  return (
    typeof type === 'function' &&
    (typeof type.prototype === 'undefined' ||
     typeof type.prototype.render !== 'function')
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

  if (node === null || node === false) {
    node = ReactEmptyComponent.emptyElement;
  }

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
    if (parentCompositeType === element.type &&
        typeof element.type === 'string') {
      // Avoid recursion if the wrapper renders itself.
      instance = ReactNativeComponent.createInternalComponent(element);
      // All native components are currently wrapped in a composite so we're
      // safe to assume that this is what we should instantiate.
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // represenations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      instance = new element.type(element);
    } else if (isPropablyStatelessComponentType(element.type)) {
      instance = new ReactStatelessOrCompositeComponentWrapper();
    } else {
      instance = new ReactCompositeComponentWrapper();
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactNativeComponent.createInstanceForText(node);
  } else {
    invariant(
      false,
      'Encountered invalid React node of type %s',
      typeof node
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

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  instance._mountIndex = 0;
  instance._mountImage = null;

  if (__DEV__) {
    instance._isOwnerNecessary = false;
    instance._warnedAboutRefsInRender = false;
  }

  // Internal instances should fully constructed at this point, so they should
  // not get any new fields added to them at this point.
  if (__DEV__) {
    if (Object.preventExtensions) {
      Object.preventExtensions(instance);
    }
  }

  return instance;
}

module.exports = instantiateReactComponent;
