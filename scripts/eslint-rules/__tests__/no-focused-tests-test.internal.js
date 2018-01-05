/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-focused-tests');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run('eslint-rules/no-focused-tests', rule, {
  valid: ['describe()', 'it()', 'xdescribe()', 'xit()'],
  invalid: [
    {
      code: 'fdescribe()',
      errors: [
        {
          message: 'Focused tests are not allowed.',
        },
      ],
    },
    {
      code: 'fit()',
      errors: [
        {
          message: 'Focused tests are not allowed.',
        },
      ],
    },
  ],
});
