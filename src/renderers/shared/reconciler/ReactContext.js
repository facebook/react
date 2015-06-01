/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactContext
 */

'use strict';

var ReactNativeComponent = require('ReactNativeComponent');

var emptyObject = require('emptyObject');

/**
 * Array comparator for ReactComponents by mount ordering.
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder;
}

function containsMatchingKey(obj1, obj2) {
  var keys = Object.keys(obj1);

  for (var i = 0, l = keys.length; i < l; ++i) {
    if (obj2.hasOwnProperty(keys[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Keeps track of the current context.
 *
 * The context is automatically passed down the component ownership hierarchy
 * and is accessible via `this.context` on ReactCompositeComponents.
 */
var ReactContext = {

  /**
   * @internal
   * @type {object}
   */
  current: emptyObject,

  currentParent: null,
  
  parentChild: function(child, parent) {
    if (parent) {
      var ParentComponent = ReactNativeComponent.getComponentClassForElement(
        parent._currentElement
      );

      var ChildComponent = ReactNativeComponent.getComponentClassForElement(
        child._currentElement
      );

      if (
        ChildComponent.contextTypes &&
        ParentComponent.childContextTypes &&
        containsMatchingKey(
          ChildComponent.contextTypes,
          ParentComponent.childContextTypes
        )
      ) {
        this._addChildToParent(parent, child);
        child._contextParent = parent;

        return;
      }

      return this.parentChild(child, parent._contextParent);
    }

    child._contextParent = null;
  },
  
  orphanChild: function(child) {
    if (!child._contextParent) {
      return;
    }

    this._removeChildFromParent(child._contextParent, child);
    child._contextParent = null;
  },
  
  _addChildToParent: function(parent, child) {
    var children = parent._contextChildren = parent._contextChildren || [];

    children.push(child);
    children.sort(mountOrderComparator);
  },
  
  _removeChildFromParent: function(parent, child) {
    var children = parent._contextChildren;
    
    if (!children) {
      return;
    }
    
    var index = children.indexOf(child);
    if (index >= 0) {
      children.splice(index, 1); 
    }
  }

};

module.exports = ReactContext;
