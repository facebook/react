/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = function(babel, options) {
  var t = babel.types;

  var DEV_EXPRESSION = t.identifier('__DEV__');

  var SEEN_SYMBOL = Symbol('expression.seen');

  return {
    visitor: {
      CallExpression: {
        exit: function(path) {
          var node = path.node;

          // Ignore if it's already been processed
          if (node[SEEN_SYMBOL]) {
            return;
          }

          if (path.get('callee').isIdentifier({name: 'warning'})) {
            node[SEEN_SYMBOL] = true;

            // Turns this code:
            //
            // warning(condition, argument, argument);
            //
            // into this:
            //
            // if (__DEV__) {
            //   warning(condition, argument, argument);
            // }
            //
            // The goal is to strip out warning calls entirely in production.
            path.replaceWith(
              t.ifStatement(
                DEV_EXPRESSION,
                t.blockStatement([t.expressionStatement(node)])
              )
            );
          }
        },
      },
    },
  };
};
