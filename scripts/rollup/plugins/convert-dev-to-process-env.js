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

  const DEV_IDENTIFIER = {name: '__DEV__'};
  const PROCESS_ENV_EXPRESSION = t.binaryExpression(
    '!==',
    t.memberExpression(
      t.memberExpression(t.identifier('process'), t.identifier('env'), false),
      t.identifier('NODE_ENV'),
      false
    ),
    t.stringLiteral('production')
  );

  var SEEN_SYMBOL = Symbol('expression.seen');

  return {
    pre: function() {
      this.prodInvariantIdentifier = null;
    },

    visitor: {
      Identifier: {
        enter: function(path) {
          // Replace __DEV__ with process.env.NODE_ENV !== 'production'
          if (path.isIdentifier(DEV_IDENTIFIER)) {
            path.replaceWith(PROCESS_ENV_EXPRESSION);
          }
        },
      },
    },
  };
};
