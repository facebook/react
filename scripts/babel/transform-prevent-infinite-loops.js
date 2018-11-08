/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

module.exports = ({types: t, template}) => {
  // We set a global so that we can later fail the test
  // even if the error ends up being caught by the code.
  const buildGuard = template(`
    if (ITERATOR++ > MAX_ITERATIONS) {
      global.infiniteLoopError = new RangeError(
        'Potential infinite loop: exceeded ' +
        MAX_ITERATIONS +
        ' iterations.'
      );
      throw global.infiniteLoopError;
    }
  `);

  return {
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
        const guard = buildGuard({
          ITERATOR: iterator,
          MAX_ITERATIONS: t.numericLiteral(MAX_ITERATIONS),
        });
        // No block statement e.g. `while (1) 1;`
        if (!path.get('body').isBlockStatement()) {
          const statement = path.get('body').node;
          path.get('body').replaceWith(t.blockStatement([guard, statement]));
        } else {
          path.get('body').unshiftContainer('body', guard);
        }
      },
    },
  };
};
