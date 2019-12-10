/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../warning-args');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run('eslint-rules/warning-args', rule, {
  valid: [
    "warning('hello, world');",
    "warning('expected %s, got %s', 42, 24);",
    'arbitraryFunction(a, b)',
  ],
  invalid: [
    {
      code: 'warning(null);',
      errors: [
        {
          message: 'The first argument to warning must be a string literal',
        },
      ],
    },
    {
      code: 'var g = 5; warning(g);',
      errors: [
        {
          message: 'The first argument to warning must be a string literal',
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
            'Expected 1 arguments in call to warning based on the number of ' +
            '"%s" substitutions, but got 2',
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
  ],
});
