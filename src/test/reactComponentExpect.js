/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule reactComponentExpect
 * @nolint
 */

'use strict';

var ReactInstanceMap = require('ReactInstanceMap');
var ReactTestUtils = require('ReactTestUtils');

var assign = require('Object.assign');

function reactComponentExpect(instance) {
  if (instance instanceof reactComponentExpectInternal) {
    return instance;
  }

  if (!(this instanceof reactComponentExpect)) {
    return new reactComponentExpect(instance);
  }

  expect(instance).not.toBeNull();

  var internalInstance = ReactInstanceMap.get(instance);

  expect(typeof internalInstance).toBe('object');
  expect(typeof internalInstance.constructor).toBe('function');
  expect(ReactTestUtils.isElement(internalInstance)).toBe(false);

  return new reactComponentExpectInternal(internalInstance);
}

function reactComponentExpectInternal(internalInstance) {
  this._instance = internalInstance;
}

assign(reactComponentExpectInternal.prototype, {
  // Getters -------------------------------------------------------------------

  /**
   * @instance: Retrieves the backing instance.
   */
  instance: function() {
    return this._instance.getPublicInstance();
  },

  /**
   * There are two types of components in the world.
   * - A component created via React.createClass() - Has a single child
   *   subComponent - the return value from the .render() function. This
   *   function @subComponent expects that this._instance is component created
   *   with React.createClass().
   * - A primitive DOM component - which has many renderedChildren, each of
   *   which may have a name that is unique with respect to its siblings. This
   *   method will fail if this._instance is a primitive component.
   *
   * TL;DR: An instance may have a subComponent (this._renderedComponent) or
   * renderedChildren, but never both. Neither will actually show up until you
   * render the component (simply instantiating is not enough).
   */
  expectRenderedChild: function() {
    this.toBeCompositeComponent();
    var child = this._instance._renderedComponent;
    // TODO: Hide ReactEmptyComponent instances here?
    return new reactComponentExpectInternal(child);
  },

  /**
   * The nth child of a DOMish component instance that is not falsy.
   */
  expectRenderedChildAt: function(childIndex) {
    // Currently only dom components have arrays of children, but that will
    // change soon.
    this.toBeDOMComponent();
    var renderedChildren =
      this._instance._renderedComponent._renderedChildren || {};
    for (var name in renderedChildren) {
      if (!renderedChildren.hasOwnProperty(name)) {
        continue;
      }
      if (renderedChildren[name]) {
        if (renderedChildren[name]._mountIndex === childIndex) {
          return new reactComponentExpectInternal(renderedChildren[name]);
        }
      }
    }
    throw new Error('Child:' + childIndex + ' is not found');
  },

  toBeDOMComponentWithChildCount: function(n) {
    this.toBeDOMComponent();
    expect(this._instance._renderedComponent._renderedChildren).toBeTruthy();
    var len = Object.keys(this._instance._renderedComponent._renderedChildren)
              .length;
    expect(len).toBe(n);
    return this;
  },

  toBeDOMComponentWithNoChildren: function() {
    this.toBeDOMComponent();
    expect(this._instance._renderedComponent._renderedChildren).toBeFalsy();
    return this;
  },

  // Matchers ------------------------------------------------------------------

  toBeComponentOfType: function(constructor) {
    expect(
      this._instance._currentElement.type === constructor
    ).toBe(true);
    return this;
  },

  /**
   * A component that is created with React.createClass. Just duck typing
   * here.
   */
  toBeCompositeComponent: function() {
    expect(
      typeof this.instance() === 'object' &&
      typeof this.instance().render === 'function'
    ).toBe(true);
    return this;
  },

  toBeCompositeComponentWithType: function(constructor) {
    this.toBeCompositeComponent();
    expect(
      this._instance._currentElement.type === constructor
    ).toBe(true);
    return this;
  },

  toBeTextComponentWithValue: function(val) {
    var elementType = typeof this._instance._currentElement;
    expect(elementType === 'string' || elementType === 'number').toBe(true);
    expect(this._instance._stringText).toBe(val);
    return this;
  },

  toBePresent: function() {
    expect(this.instance()).toBeTruthy();
    return this;
  },

  /**
   * A terminal type of component representing some virtual dom node. Just duck
   * typing here.
   */
  toBeDOMComponent: function() {
    expect(ReactTestUtils.isDOMComponent(this.instance())).toBe(true);
    return this;
  },

  /**
   * @deprecated
   * @see toBeComponentOfType
   */
  toBeDOMComponentWithTag: function(tag) {
    this.toBeDOMComponent();
    expect(this.instance().tagName).toBe(tag.toUpperCase());
    return this;
  },

  /**
   * Check that internal state values are equal to a state of expected values.
   */
  scalarStateEqual: function(stateNameToExpectedValue) {
    expect(this.instance()).toBeTruthy();
    for (var stateName in stateNameToExpectedValue) {
      if (!stateNameToExpectedValue.hasOwnProperty(stateName)) {
        continue;
      }
      expect(this.instance().state[stateName])
        .toEqual(stateNameToExpectedValue[stateName]);
    }
    return this;
  },

  /**
   * Check a set of props are equal to a set of expected values - only works
   * with scalars.
   */
  scalarPropsEqual: function(propNameToExpectedValue) {
    expect(this.instance()).toBeTruthy();
    for (var propName in propNameToExpectedValue) {
      if (!propNameToExpectedValue.hasOwnProperty(propName)) {
        continue;
      }
      expect(this.instance().props[propName])
        .toEqual(propNameToExpectedValue[propName]);
    }
    return this;
  },

  /**
   * Check a set of props are equal to a set of expected values - only works
   * with scalars.
   */
  scalarContextEqual: function(contextNameToExpectedValue) {
    expect(this.instance()).toBeTruthy();
    for (var contextName in contextNameToExpectedValue) {
      if (!contextNameToExpectedValue.hasOwnProperty(contextName)) {
        continue;
      }
      expect(this.instance().context[contextName])
        .toEqual(contextNameToExpectedValue[contextName]);
    }
    return this;
  }
});

module.exports = reactComponentExpect;
