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
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester();

ruleTester.run('eslint-rules/warning-args', rule, {
  valid: [
    "console.error('hello, world');",
    "console.error('expected %s, got %s', 42, 24);",
    'arbitraryFunction(a, b)',
  ],
  invalid: [
    {
      code: 'console.error(null);',
      errors: [
        {
          message:
            'The first argument to console.error must be a string literal',
        },
      ],
    },
    {
      code: 'console.warn(null);',
      errors: [
        {
          message:
            'The first argument to console.warn must be a string literal',
        },
      ],
    },
    {
      code: 'var g = 5; console.error(g);',
      errors: [
        {
          message:
            'The first argument to console.error must be a string literal',
        },
      ],
    },
    {
      code: "console.error('expected %s, got %s');",
      errors: [
        {
          message:
            'Expected 3 arguments in call to console.error based on the number of ' +
            '"%s" substitutions, but got 1',
        },
      ],
    },
    {
      code: "console.error('foo is a bar under foobar', 'junk argument');",
      errors: [
        {
          message:
            'Expected 1 arguments in call to console.error based on the number of ' +
            '"%s" substitutions, but got 2',
        },
      ],
    },
    {
      code: "console.error('error!');",
      errors: [
        {
          message:
            'The console.error format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: error!',
        },
      ],
    },
    {
      code: "console.error('%s %s, %s %s: %s (%s)', 1, 2, 3, 4, 5, 6);",
      errors: [
        {
          message:
            'The console.error format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: ' +
            '%s %s, %s %s: %s (%s)',
        },
      ],
    },
  ],
});
