/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../prod-error-codes');
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2017,
  },
});

ruleTester.run('eslint-rules/prod-error-codes', rule, {
  valid: [
    'arbitraryFunction(a, b)',
    'Error(`Expected ${foo} target to be an array; got ${bar}`)',
    "Error('Expected ' + foo + ' target to be an array; got ' + bar)",
    'Error(`Expected ${foo} target to ` + `be an array; got ${bar}`)',
  ],
  invalid: [
    {
      code: "Error('Not in error map')",
      errors: [
        {
          message:
            'Error message does not have a corresponding production error ' +
            'code. Add the following message to codes.json so it can be stripped from ' +
            'the production builds:\n\n' +
            'Not in error map',
        },
      ],
    },
    {
      code: "Error('Not in ' + 'error map')",
      errors: [
        {
          message:
            'Error message does not have a corresponding production error ' +
            'code. Add the following message to codes.json so it can be stripped from ' +
            'the production builds:\n\n' +
            'Not in error map',
        },
      ],
    },
    {
      code: 'Error(`Not in ` + `error map`)',
      errors: [
        {
          message:
            'Error message does not have a corresponding production error ' +
            'code. Add the following message to codes.json so it can be stripped from ' +
            'the production builds:\n\n' +
            'Not in error map',
        },
      ],
    },
    {
      code: "Error(`Not in ${'error'} map`)",
      errors: [
        {
          message:
            'Error message does not have a corresponding production error ' +
            'code. Add the following message to codes.json so it can be stripped from ' +
            'the production builds:\n\n' +
            'Not in %s map',
        },
      ],
    },
  ],
});
