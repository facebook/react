/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../warning-and-invariant-args');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run('eslint-rules/warning-and-invariant-args', rule, {
  valid: [
    "warning('hello, world');",
    "warning('expected %s, got %s', 42, 24);",
    'arbitraryFunction(a, b)',
    // These messages are in the error code map
    "invariant('Do not override existing functions.')",
    "invariant('%s(...): Target container is not a DOM element.', str)",
  ],
  invalid: [
    {
      code: 'warning();',
      errors: [
        {
          message: 'warning takes at least one argument',
        },
      ],
    },
    {
      code: 'warning(null);',
      errors: [
        {
          message: 'The first argument to warning must be a string literal',
        },
      ],
    },
    {
      code: 'var g = 5; invariant(g);',
      errors: [
        {
          message: 'The first argument to invariant must be a string literal',
        },
      ],
    },
    {
      code: "warning('expected %s, got %s');",
      errors: [
        {
          message:
            'Expected 3 arguments in call to warning based on the number of ' +
            '"%s" substitutions, but got 1',
        },
      ],
    },
    {
      code: "warning('foo is a bar under foobar', 'junk argument');",
      errors: [
        {
          message:
            'Expected 1 argument in call to warning based on the number of ' +
            '"%s" substitutions, but got 2',
        },
      ],
    },
    {
      code: "invariant('error!');",
      errors: [
        {
          message:
            'The invariant format should be able to uniquely identify this ' +
            'invariant. Please, use a more descriptive format than: error!',
        },
      ],
    },
    {
      code: "warning('error!');",
      errors: [
        {
          message:
            'The warning format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: error!',
        },
      ],
    },
    {
      code: "warning('%s %s, %s %s: %s (%s)', 1, 2, 3, 4, 5, 6);",
      errors: [
        {
          message:
            'The warning format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: ' +
            '%s %s, %s %s: %s (%s)',
        },
      ],
    },
    {
      code: "invariant('Not in error map')",
      errors: [
        {
          message:
            'Error message does not have a corresponding production error code.\n\n' +
            'Run `yarn extract-errors` to add the message to error code map, ' +
            'so it can be stripped from the production builds. ' +
            "Alternatively, if you're updating an existing error message, " +
            'you can modify `scripts/error-codes/codes.json` directly.',
        },
      ],
    },
  ],
});
