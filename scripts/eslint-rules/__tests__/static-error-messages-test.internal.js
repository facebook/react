/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../static-error-messages');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester({
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 2017,
  },
});

ruleTester.run('eslint-rules/static-error-messages', rule, {
  valid: [
    'new Error()',
    "new Error('what')",
    "new Error('what did you do ' + 'andrew')",
    'new Error(`what did you do ${name}`)',
    'Error()',
    "Error('what')",
    "Error('what did you do ' + 'andrew')",
    'Error(`what did you do ${name}`)',
    `
     // extract-errors/skip
     Error(usuallyAnError)`,
    `// extract-errors/skip
     throw new Error(message);`,
    `// extract-errors/skip
     const error = new Error(message);`,
  ],
  invalid: [
    {
      code: 'new Error(what)',
      errors: [
        {
          message:
            'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.',
        },
      ],
    },
    {
      code: "new Error('what did you do ' + name)",
      errors: [
        {
          message:
            'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.',
        },
      ],
    },
    {
      code: 'new Error(clown, town)',
      errors: [
        {
          message: 'Too many arguments passed to Error.',
        },
      ],
    },
    {
      code: 'Error(what)',
      errors: [
        {
          message:
            'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.',
        },
      ],
    },
    {
      code: "Error('what did you do ' + name)",
      errors: [
        {
          message:
            'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.',
        },
      ],
    },
    {
      code: 'Error(clown, town)',
      errors: [
        {
          message: 'Too many arguments passed to Error.',
        },
      ],
    },
    {
      code: `
        // unrelated comment
        Error(ahaha)
`,
      errors: [
        {
          message:
            'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.',
        },
      ],
    },
  ],
});
