/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = function(babel, options) {
  const t = babel.types;

  const DEV_EXPRESSION = t.identifier('__DEV__');

  const SEEN_SYMBOL = Symbol('expression.seen');

  return {
    visitor: {
      CallExpression: {
        exit: function(path) {
          const node = path.node;

          // Ignore if it's already been processed
          if (node[SEEN_SYMBOL]) {
            return;
          }

          if (
            path.get('callee').isIdentifier({name: 'warning'}) ||
            path.get('callee').isIdentifier({name: 'warningWithoutStack'})
          ) {
            // Turns this code:
            //
            // warning(condition, argument, argument);
            //
            // into this:
            //
            // if (__DEV__) {
            //   if (!condition) {
            //     warning(false, argument, argument);
            //   }
            // }
            //
            // The goal is to strip out warning calls entirely in production
            // and to avoid evaluating the arguments in development.
            const condition = node.arguments[0];
            const newNode = t.callExpression(
              node.callee,
              [t.booleanLiteral(false)].concat(node.arguments.slice(1))
            );
            newNode[SEEN_SYMBOL] = true;
            path.replaceWith(
              t.ifStatement(
                DEV_EXPRESSION,
                t.blockStatement([
                  t.ifStatement(
                    t.unaryExpression('!', condition),
                    t.expressionStatement(newNode)
                  ),
                ])
              )
            );
          }
        },
      },
    },
  };
};
