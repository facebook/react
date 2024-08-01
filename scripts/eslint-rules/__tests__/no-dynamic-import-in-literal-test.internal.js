/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-dynamic-import-in-literal');
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
});

ruleTester.run('eslint-rules/no-dynamic-import-in-literal', rule, {
  valid: [
    `console.log(
      'import react from "react"'
    )`,
    `console.log(
      'should work for non-import expression'
    )`,
  ],
  invalid: [
    {
      code: `console.log(
          'import("react")'
        )`,
      errors: [
        {
          message: 'Possible dynamic import expression in literal',
        },
      ],
    },
    {
      code: `console.log(
          'const MyComponent = lazy(() => import("./MyComponent"))'
        )`,
      errors: [
        {
          message: 'Possible dynamic import expression in literal',
        },
      ],
    },
  ],
});
