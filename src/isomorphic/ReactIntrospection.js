/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIntrospection
 */

'use strict';

var invariant = require('invariant');

function validateInstance(instance) {
  invariant(
    typeof instance.mountComponent === 'function',
    'ReactIntrospection: Argument is not an internal instance.'
  );
}

function getChildren(instance) {
  if (instance == null) {
    return [];
  }
  validateInstance(instance);

  if (instance._renderedComponent) {
    if (instance._renderedComponent._currentElement) {
      return [instance._renderedComponent];
    } else {
      return [];
    }
  } else if (instance._renderedChildren) {
    var children = [];
    for (var key in instance._renderedChildren) {
      children.push(instance._renderedChildren[key]);
    }
    return children;
  } else {
    return [];
  }
}

function getDisplayName(instance) {
  if (instance == null) {
    return 'Unknown';
  }
  validateInstance(instance);

  var name;
  if (instance.getName) {
    name = instance.getName();
  }
  if (name) {
    return name;
  }
  var element = instance._currentElement;
  if (element == null) {
    name = '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    name = '#text';
  } else if (typeof element.type === 'string') {
    name = element.type;
  } else {
    name = element.type.displayName || element.type.name;
  }
  return name || 'Unknown';
}

function isComposite(instance) {
  if (instance == null) {
    return false;
  }
  validateInstance(instance);
  
  var element = instance._currentElement;
  if (element == null) {
    return false;
  }
  return typeof element.type === 'function';
}

var ReactIntrospection = {
  getChildren,
  getDisplayName,
  isComposite,
};

module.exports = ReactIntrospection;
