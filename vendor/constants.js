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
      },
    },
    CallExpression: {
      exit: function(node, parent) {
        if (this.get('callee').isIdentifier({name: 'invariant'})) {
          // Turns this code:
          //
          // invariant(condition, argument, argument);
          //
          // into this:
          //
          // if (!condition) {
          //   if ("production" !== process.env.NODE_ENV) {
          //     invariant(false, argument, argument);
          //   } else {
          //     invariant(false);
          //   }
          // }
          //
          // Specifically this does 2 things:
          // 1. Checks the condition first, preventing an extra function call.
          // 2. Adds an environment check so that verbose error messages aren't
          //    shipped to production.
          // The generated code is longer than the original code but will dead
          // code removal in a minifier will strip that out.
          var condition = node.arguments[0];
          return t.ifStatement(
            t.unaryExpression('!', condition),
            t.blockStatement([
              t.ifStatement(
                DEV_EXPRESSION,
                t.blockStatement([
                  t.expressionStatement(
                    t.callExpression(
                      node.callee,
                      [t.literal(false)].concat(node.arguments.slice(1))
                    )
                  ),
                ]),
                t.blockStatement([
                  t.expressionStatement(
                    t.callExpression(
                      node.callee,
                      [t.literal(false)]
                    )
                  ),
                ])
              ),
            ])
          );
        } else if (this.get('callee').isIdentifier({name: 'warning'})) {
          // Turns this code:
          //
          // warning(condition, argument, argument);
          //
          // into this:
          //
          // if ("production" !== process.env.NODE_ENV) {
          //   warning(condition, argument, argument);
          // }
          //
          // The goal is to strip out warning calls entirely in production. We
          // don't need the same optimizations for conditions that we use for
          // invariant because we don't care about an extra call in __DEV__

          return t.ifStatement(
            DEV_EXPRESSION,
            t.blockStatement([
              t.expressionStatement(
                node
              ),
            ])
          );
        }
      },
    },
  });
};
