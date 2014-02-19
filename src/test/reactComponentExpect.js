/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule reactComponentExpect
 * @nolint
 */

var ReactComponent = require('ReactComponent');
var ReactTestUtils = require('ReactTestUtils');

var mergeInto = require('mergeInto');

function reactComponentExpect(instance) {
  if (instance instanceof reactComponentExpect) {
    return instance;
  }

  if (!(this instanceof reactComponentExpect)) {
    return new reactComponentExpect(instance);
  }

  this._instance = instance;
  this.toBeValidReactComponent();
}

mergeInto(reactComponentExpect.prototype, {
  // Getters -------------------------------------------------------------------

  /**
   * @instance: Retrieves the backing instance.
   */
  instance: function() {
    return this._instance;
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
    return new reactComponentExpect(this.instance()._renderedComponent);
  },

  /**
   * The nth child of a DOMish component instance that is not falsy.
   */
  expectRenderedChildAt: function(childIndex) {
    // Currently only dom components have arrays of children, but that will
    // change soon.
    this.toBeDOMComponent();
    var renderedChildren = this.instance()._renderedChildren || {};
    var nonEmptyCount = 0;
    var name;
    for (name in renderedChildren) {
      if (!renderedChildren.hasOwnProperty(name)) {
        continue;
      }
      if (renderedChildren[name]) {
        if (nonEmptyCount === childIndex) {
          return new reactComponentExpect(renderedChildren[name]);
        }
        nonEmptyCount++;
      }
    }
    throw new Error('Child:' + childIndex + ' is not found');
  },

  toBeDOMComponentWithChildCount: function(n) {
    this.toBeDOMComponent();
    expect(this.instance()._renderedChildren).toBeTruthy();
    var len = Object.keys(this.instance()._renderedChildren).length;
    expect(len).toBe(n);
    return this;
  },

  toBeDOMComponentWithNoChildren: function() {
    this.toBeDOMComponent();
    expect(this.instance()._renderedChildren).toBeFalsy();
    return this;
  },

  // Matchers ------------------------------------------------------------------

  toBeComponentOfType: function(convenienceConstructor) {
    expect(ReactTestUtils.isComponentOfType(
      this.instance(),
      convenienceConstructor
    )).toBe(true);
    return this;
  },

  /**
   * A component that is created with React.createClass. Just duck typing
   * here.
   */
  toBeCompositeComponent: function() {
    this.toBeValidReactComponent();
    expect(ReactTestUtils.isCompositeComponent(this.instance())).toBe(true);
    return this;
  },

  toBeCompositeComponentWithType: function(convenienceConstructor) {
    expect(ReactTestUtils.isCompositeComponentWithType(
      this.instance(),
      convenienceConstructor
    )).toBe(true);
    return this;
  },

  toBeTextComponent: function() {
    expect(ReactTestUtils.isTextComponent(this.instance())).toBe(true);
    return this;
  },

  /**
   * Falsy values are valid components - the vanished component that is.
   */
  toBeValidReactComponent: function() {
    expect(ReactComponent.isValidComponent(this.instance())).toBe(true);
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
