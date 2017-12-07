/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: attribution (this is based on https://repl.it/site/blog/infinite-loops)

'use strict';

module.exports = ({types: t}) => ({
  visitor: {
    'WhileStatement|ForStatement|DoWhileStatement': p => {
      // A variable holding when the loop was started
      const loopStart = p.scope.parent.generateUidIdentifier('loopStart');
      const loopStartInit = t.callExpression(
        t.memberExpression(t.identifier('Date'), t.identifier('now')),
        []
      );
      p.scope.parent.push({
        id: loopStart,
        init: loopStartInit,
      });

      // An iterator that is incremented with each iteration
      const iterator = p.scope.parent.generateUidIdentifier('loopIt');
      const iteratorInit = t.numericLiteral(0);
      p.scope.parent.push({
        id: iterator,
        init: iteratorInit,
      });

      // setTimeout to protect against breaking async and generator funcs.
      p.insertBefore(
        t.expressionStatement(
          t.callExpression(t.identifier('setTimeout'), [
            t.functionExpression(
              null,
              [],
              t.blockStatement([
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    loopStart,
                    t.identifier('Infinity')
                  )
                ),
              ])
            ),
          ])
        )
      );

      // If statement and throw error if it matches our criteria
      const guard = t.ifStatement(
        t.logicalExpression(
          '&&',
          t.binaryExpression(
            '>',
            t.updateExpression('++', iterator, true),
            t.numericLiteral(10000) // iterations
          ),
          t.binaryExpression(
            '>',
            t.binaryExpression(
              '-',
              t.callExpression(
                t.memberExpression(t.identifier('Date'), t.identifier('now')),
                []
              ),
              loopStart
            ),
            t.numericLiteral(5000) // ms
          )
        ),
        t.throwStatement(
          t.newExpression(t.identifier('RangeError'), [
            t.stringLiteral('Potential infinite loop.'),
          ])
        )
      );

      // No block statment e.g. `while (1) 1;`
      if (!p.get('body').isBlockStatement()) {
        const statement = p.get('body').node;
        p.get('body').replaceWith(t.blockStatement([guard, statement]));
      } else {
        p.get('body').unshiftContainer('body', guard);
      }
    },
  },
});
