/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = function(babel, options) {
  const t = babel.types;

  const DEV_EXPRESSION = t.identifier('__DEV__');

  const seen = new WeakSet();

  return {
    visitor: {
      CallExpression: {
        exit: function(path) {
          const node = path.node;

          // Ignore if it's already been processed
          if (seen.has(node)) {
            return;
          }

          if (
            path.get('callee').isIdentifier({name: 'warning'}) ||
            path.get('callee').isIdentifier({name: 'warningWithoutStack'}) ||
            path.get('callee').isIdentifier({name: 'lowPriorityWarning'}) ||
            path
              .get('callee')
              .isIdentifier({name: 'lowPriorityWarningWithoutStack'})
          ) {
            seen.add(node);

            // Turns this code:
            //
            // if (!condition) {
            //   warning(argument, argument);
            // }
            //
            // into this:
            //
            // if (__DEV__ && !condition) {
            //   warning(argument, argument);
            // }
            //
            // The goal is to strip out warning calls entirely in production
            // and to avoid evaluating the rest of the arguments in development.

            if (path.parentPath.isExpressionStatement()) {
              const maybeBlock = path.parentPath.parentPath;
              if (
                // only continue this branch if this is the only statement in the block statement
                !(
                  maybeBlock.isBlockStatement() &&
                  maybeBlock.node.body.length !== 1
                )
              ) {
                const parent = maybeBlock.isBlockStatement()
                  ? maybeBlock.parentPath
                  : maybeBlock;
                if (parent.isIfStatement()) {
                  const test = parent.get('test');
                  test.replaceWith(
                    t.logicalExpression('&&', DEV_EXPRESSION, test.node)
                  );
                  return;
                }
              }
            }

            path.replaceWith(
              t.conditionalExpression(
                DEV_EXPRESSION,
                node,
                t.unaryExpression('void', t.numericLiteral(0))
              )
            );
          }
        },
      },
    },
  };
};
