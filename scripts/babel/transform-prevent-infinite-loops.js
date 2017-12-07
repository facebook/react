/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * Copyright (c) 2017, Amjad Masad
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Based on https://repl.it/site/blog/infinite-loops.

// This should be reasonable for all loops in the source.
// Note that if the numbers are too large, the tests will take too long to fail
// for this to be useful (each individual test case might hit an infinite loop).
const MAX_SOURCE_ITERATIONS = 1500;
// Code in tests themselves is permitted to run longer.
// For example, in the fuzz tester.
const MAX_TEST_ITERATIONS = 5000;

module.exports = ({types: t}) => ({
  visitor: {
    'WhileStatement|ForStatement|DoWhileStatement': (path, file) => {
      const filename = file.file.opts.filename;
      const MAX_ITERATIONS =
        filename.indexOf('__tests__') === -1
          ? MAX_SOURCE_ITERATIONS
          : MAX_TEST_ITERATIONS;

      // An iterator that is incremented with each iteration
      const iterator = path.scope.parent.generateUidIdentifier('loopIt');
      const iteratorInit = t.numericLiteral(0);
      path.scope.parent.push({
        id: iterator,
        init: iteratorInit,
      });
      // If statement and throw error if it matches our criteria
      const guard = t.ifStatement(
        t.binaryExpression(
          '>',
          t.updateExpression('++', iterator, true),
          t.numericLiteral(MAX_ITERATIONS)
        ),
        t.throwStatement(
          t.newExpression(t.identifier('RangeError'), [
            t.stringLiteral(
              `Potential infinite loop: exceeded ${MAX_ITERATIONS} iterations.`
            ),
          ])
        )
      );
      // No block statment e.g. `while (1) 1;`
      if (!path.get('body').isBlockStatement()) {
        const statement = path.get('body').node;
        path.get('body').replaceWith(t.blockStatement([guard, statement]));
      } else {
        path.get('body').unshiftContainer('body', guard);
      }
    },
  },
});
