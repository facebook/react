/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var recast = require('recast');
var types = recast.types;
var builders = types.builders;

function propagate(constants, source) {
  return recast.print(transform(recast.parse(source), constants)).code;
}

var DEV_EXPRESSION = builders.binaryExpression(
  '!==',
  builders.literal('production'),
  builders.memberExpression(
    builders.memberExpression(
      builders.identifier('process'),
      builders.identifier('env'),
      false
    ),
    builders.identifier('NODE_ENV'),
    false
  )
);

var visitors = {
  visitIdentifier: function(nodePath) {
    // If the identifier is the property of a member expression
    // (e.g. object.property), then it definitely is not a constant
    // expression that we want to replace.
    if (nodePath.parentPath.value.type === 'MemberExpression') {
      return false;
    }

    // replace __DEV__ with process.env.NODE_ENV !== 'production'
    if (nodePath.value.name === '__DEV__') {
      nodePath.replace(DEV_EXPRESSION);
    }
    // TODO: bring back constant replacement if we decide we need it

    this.traverse(nodePath);
  },

  visitCallExpression: function(nodePath) {
    var node = nodePath.value;
    if (node.callee.name === 'invariant') {
      // Truncate the arguments of invariant(condition, ...)
      // statements to just the condition based on NODE_ENV
      // (dead code removal will remove the extra bytes).
      nodePath.replace(
        builders.conditionalExpression(
          DEV_EXPRESSION,
          node,
          builders.callExpression(
            node.callee,
            [node.arguments[0]]
          )
        )
      );
      return false;
    } else if (node.callee.name === 'warning') {
      // Eliminate warning(condition, ...) statements based on NODE_ENV
      // (dead code removal will remove the extra bytes).
      nodePath.replace(
        builders.conditionalExpression(
          DEV_EXPRESSION,
          node,
          builders.literal(null)
        )
      );
      return false;
    }
    this.traverse(nodePath);
  }
}

function transform(ast, constants) {
  // TODO constants
  return recast.visit(ast, visitors);
}

exports.propagate = propagate;
exports.transform = transform;
