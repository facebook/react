/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule reactComponentExpect
 */

'use strict';

var ReactInstanceMap = require('react-dom/lib/ReactInstanceMap');
var ReactTestUtils = require('react-dom/lib/ReactTestUtils');
var ReactTypeOfWork = require('ReactTypeOfWork');

var {
  HostText,
} = ReactTypeOfWork;

var invariant = require('fbjs/lib/invariant');

// Fiber doesn't actually have an instance for empty components
// but we'll pretend it does while we keep compatibility with Stack.
var fiberNullInstance = {
  type: null,
  child: null,
  sibling: null,
  tag: 99,
};

function reactComponentExpect(instance) {
  if (instance instanceof reactComponentExpectInternal) {
    return instance;
  }

  if (!(this instanceof reactComponentExpect)) {
    return new reactComponentExpect(instance);
  }

  expect(instance).not.toBeNull();
  expect(instance).not.toBeUndefined();

  invariant(
    ReactTestUtils.isCompositeComponent(instance),
    'reactComponentExpect(...): instance must be a composite component',
  );
  var internalInstance = ReactInstanceMap.get(instance);

  expect(typeof internalInstance).toBe('object');
  expect(typeof internalInstance.constructor).toBe('function');
  expect(ReactTestUtils.isElement(internalInstance)).toBe(false);

  return new reactComponentExpectInternal(internalInstance);
}

function reactComponentExpectInternal(internalInstance) {
  this._instance = internalInstance;
}

Object.assign(reactComponentExpectInternal.prototype, {
  // Getters -------------------------------------------------------------------

  /**
   * @instance: Retrieves the backing instance.
   */
  instance: function() {
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      return this._instance.stateNode;
    } else {
      // Stack reconciler
      return this._instance.getPublicInstance();
    }
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
    var child = null;
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      child = this._instance.child || fiberNullInstance;
    } else {
      // Stack reconciler
      child = this._instance._renderedComponent;
    }
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

    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      var child = this._instance.child;
      var i = 0;
      while (child) {
        if (i === childIndex) {
          return new reactComponentExpectInternal(child);
        }
        child = child.sibling;
        i++;
      }
    } else {
      // Stack reconciler
      var renderedChildren = this._instance._renderedChildren || {};
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
    }
    throw new Error('Child:' + childIndex + ' is not found');
  },

  toBeDOMComponentWithChildCount: function(count) {
    this.toBeDOMComponent();
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      var child = this._instance.child;
      var i = 0;
      while (child) {
        child = child.sibling;
        i++;
      }
      expect(i).toBe(count);
    } else {
      // Stack reconciler
      var renderedChildren = this._instance._renderedChildren;
      if (count > 0) {
        expect(renderedChildren).toBeTruthy();
        expect(Object.keys(renderedChildren).length).toBe(count);
      } else if (renderedChildren) {
        expect(Object.keys(renderedChildren).length).toBe(0);
      }
    }
    return this;
  },

  toBeDOMComponentWithNoChildren: function() {
    this.toBeDOMComponentWithChildCount(0);
    return this;
  },

  // Matchers ------------------------------------------------------------------

  toBeComponentOfType: function(constructor) {
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      expect(this._instance.type === constructor).toBe(true);
    } else {
      // Stack reconciler
      expect(this._instance._currentElement.type === constructor).toBe(true);
    }
    return this;
  },

  /**
   * A component that is created with React.createClass. Just duck typing
   * here.
   */
  toBeCompositeComponent: function() {
    // TODO: this code predates functional components
    // and doesn't work with them.
    expect(
      typeof this.instance() === 'object' &&
        typeof this.instance().render === 'function',
    ).toBe(true);
    return this;
  },

  toBeCompositeComponentWithType: function(constructor) {
    this.toBeCompositeComponent();
    this.toBeComponentOfType(constructor);
    return this;
  },

  toBeTextComponentWithValue: function(val) {
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      expect(this._instance.tag === HostText).toBe(true);
      var actualVal = this._instance.memoizedProps;
      expect(
        typeof actualVal === 'string' || typeof actualVal === 'number',
      ).toBe(true);
      expect('' + actualVal).toBe(val);
    } else {
      // Fiber reconciler
      var elementType = typeof this._instance._currentElement;
      expect(elementType === 'string' || elementType === 'number').toBe(true);
      expect(this._instance._stringText).toBe(val);
    }
    return this;
  },

  toBeEmptyComponent: function() {
    if (typeof this._instance.tag === 'number') {
      // Fiber reconciler
      expect(this._instance).toBe(fiberNullInstance);
    } else {
      // Stack reconciler
      var element = this._instance._currentElement;
      expect(element === null || element === false).toBe(true);
    }
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
   * Check that internal state values are equal to a state of expected values.
   */
  scalarStateEqual: function(stateNameToExpectedValue) {
    expect(this.instance()).toBeTruthy();
    for (var stateName in stateNameToExpectedValue) {
      if (!stateNameToExpectedValue.hasOwnProperty(stateName)) {
        continue;
      }
      expect(this.instance().state[stateName]).toEqual(
        stateNameToExpectedValue[stateName],
      );
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
      expect(this.instance().props[propName]).toEqual(
        propNameToExpectedValue[propName],
      );
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
      expect(this.instance().context[contextName]).toEqual(
        contextNameToExpectedValue[contextName],
      );
    }
    return this;
  },
});

module.exports = reactComponentExpect;
