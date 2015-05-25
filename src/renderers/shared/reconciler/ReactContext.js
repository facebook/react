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

var emptyObject = require('emptyObject');

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
      this._addChildToParent(parent, child);
    }

    child._contextParent = parent || null;
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

// TODO: add context parent map - parent's need to know of their nearest context child
// TODO: context parent is defined as any component with childContextType defined
//   TODO: the nearest in the tree takes parentship over the context child
// TODO: context child is defined as any component with contectType defined

module.exports = ReactContext;
