/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var rule = require('../warning-and-invariant-args');
var RuleTester = require('eslint').RuleTester;
var ruleTester = new RuleTester();

ruleTester.run('eslint-rules/warning-and-invariant-args', rule, {
  valid: [
    "warning(true, 'hello, world');",
    "warning(true, 'expected %s, got %s', 42, 24);",
    "invariant(true, 'hello, world');",
    "invariant(true, 'expected %s, got %s', 42, 24);",
  ],
  invalid: [
    {
      code: "warning('hello, world');",
      errors: [
        {
          message: 'warning takes at least two arguments',
        },
      ],
    },
    {
      code: 'warning(true, null);',
      errors: [
        {
          message: 'The second argument to warning must be a string literal',
        },
      ],
    },
    {
      code: 'var g = 5; invariant(true, g);',
      errors: [
        {
          message: 'The second argument to invariant must be a string literal',
        },
      ],
    },
    {
      code: "warning(true, 'expected %s, got %s');",
      errors: [
        {
          message: 'Expected 4 arguments in call to warning based on the number of ' +
            '"%s" substitutions, but got 2',
        },
      ],
    },
    {
      code: "warning(true, 'foo is a bar under foobar', 'junk argument');",
      errors: [
        {
          message: 'Expected 2 arguments in call to warning based on the number of ' +
            '"%s" substitutions, but got 3',
        },
      ],
    },
    {
      code: "invariant(true, 'error!');",
      errors: [
        {
          message: 'The invariant format should be able to uniquely identify this ' +
            'invariant. Please, use a more descriptive format than: error!',
        },
      ],
    },
    {
      code: "warning(true, 'error!');",
      errors: [
        {
          message: 'The warning format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: error!',
        },
      ],
    },
    {
      code: "warning(true, '%s %s, %s %s: %s (%s)', 1, 2, 3, 4, 5, 6);",
      errors: [
        {
          message: 'The warning format should be able to uniquely identify this ' +
            'warning. Please, use a more descriptive format than: ' +
            '%s %s, %s %s: %s (%s)',
        },
      ],
    },
  ],
});
