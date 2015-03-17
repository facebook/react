/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
'use strict';

var Syntax = require('jstransform').Syntax;
var utils = require('jstransform/src/utils');

function shouldAddDisplayName(object) {
  if (object &&
      object.type === Syntax.CallExpression &&
      object.callee.type === Syntax.MemberExpression &&
      object.callee.object.type === Syntax.Identifier &&
      object.callee.object.name === 'React' &&
      object.callee.property.type === Syntax.Identifier &&
      object.callee.property.name === 'createClass' &&
      object.arguments.length === 1 &&
      object.arguments[0].type === Syntax.ObjectExpression) {
    // Verify that the displayName property isn't already set
    var properties = object.arguments[0].properties;
    var safe = properties.every(function(property) {
      var value = property.key.type === Syntax.Identifier ?
        property.key.name :
        property.key.value;
      return value !== 'displayName';
    });
    return safe;
  }
  return false;
}

/**
 * If `expr` is an Identifier or MemberExpression node made of identifiers and
 * dot accesses, return a list of the identifier parts. Other nodes return null.
 *
 * Examples:
 *
 * MyComponent -> ['MyComponent']
 * namespace.MyComponent -> ['namespace', 'MyComponent']
 * namespace['foo'] -> null
 * namespace['foo'].bar -> ['bar']
 */
function flattenIdentifierOrMemberExpression(expr) {
  if (expr.type === Syntax.Identifier) {
    return [expr.name];
  } else if (expr.type === Syntax.MemberExpression) {
    if (!expr.computed && expr.property.type === Syntax.Identifier) {
      var flattenedObject = flattenIdentifierOrMemberExpression(expr.object);
      if (flattenedObject) {
        flattenedObject.push(expr.property.name);
        return flattenedObject;
      } else {
        return [expr.property.name];
      }
    }
  }
  return null;
}

/**
 * Transforms the following:
 *
 * var MyComponent = React.createClass({
 *    render: ...
 * });
 *
 * into:
 *
 * var MyComponent = React.createClass({
 *    displayName: 'MyComponent',
 *    render: ...
 * });
 *
 * Also catches:
 *
 * MyComponent = React.createClass(...);
 * namespace.MyComponent = React.createClass(...);
 * exports.MyComponent = React.createClass(...);
 * module.exports = {MyComponent: React.createClass(...)};
 */
function visitReactDisplayName(traverse, object, path, state) {
  var left, right;

  if (object.type === Syntax.AssignmentExpression) {
    left = object.left;
    right = object.right;
  } else if (object.type === Syntax.Property) {
    left = object.key;
    right = object.value;
  } else if (object.type === Syntax.VariableDeclarator) {
    left = object.id;
    right = object.init;
  }

  if (right && shouldAddDisplayName(right)) {
    var displayNamePath = flattenIdentifierOrMemberExpression(left);
    if (displayNamePath) {
      if (displayNamePath.length > 1 && displayNamePath[0] === 'exports') {
        displayNamePath.shift();
      }

      var displayName = displayNamePath.join('.');

      utils.catchup(right.arguments[0].range[0] + 1, state);
      utils.append('displayName: "' + displayName + '",', state);
    }
  }
}

visitReactDisplayName.test = function(object, path, state) {
  return (
    object.type === Syntax.AssignmentExpression ||
    object.type === Syntax.Property ||
    object.type === Syntax.VariableDeclarator
  );
};

exports.visitorList = [
  visitReactDisplayName
];
