/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = function(babel) {
  var t = babel.types;

  var DEV_EXPRESSION = t.binaryExpression(
    '!==',
    t.literal('production'),
    t.memberExpression(
      t.memberExpression(
        t.identifier('process'),
        t.identifier('env'),
        false
      ),
      t.identifier('NODE_ENV'),
      false
    )
  );

  return new babel.Transformer('react.constants', {
    Identifier: {
      enter: function(node, parent) {
        // replace __DEV__ with process.env.NODE_ENV !== 'production'
        if (this.isIdentifier({name: '__DEV__'})) {
          return DEV_EXPRESSION;
        }
      }
    },
    CallExpression: {
      exit: function(node, parent) {
        if (this.get('callee').isIdentifier({name: 'invariant'})) {
          // Truncate the arguments of invariant(condition, ...)
          // statements to just the condition based on NODE_ENV
          // (dead code removal will remove the extra bytes).
          return t.conditionalExpression(
            DEV_EXPRESSION,
            node,
            t.callExpression(node.callee, [node.arguments[0]])
          );
        } else if (this.get('callee').isIdentifier({name: 'warning'})) {
          // Eliminate warning(condition, ...) statements based on NODE_ENV
          // (dead code removal will remove the extra bytes).
          return t.conditionalExpression(
            DEV_EXPRESSION,
            node,
            t.literal(null)
          );
        }
      }
    }
  });
};
