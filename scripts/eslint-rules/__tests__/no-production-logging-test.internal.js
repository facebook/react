/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-production-logging');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run('no-production-logging', rule, {
  valid: [
    {
      code: 'if (__DEV__) {warningWithoutStack(test)}',
    },
    {
      code: 'if (__DEV__) {warning(test)}',
    },
    {
      code: 'if (__DEV__) { if (potato) { while (true) { warning(test) }}}',
    },
    {
      code: 'normalFunctionCall(test)',
    },
    {
      code: 'invariant(test)',
    },
    {
      code: 'if (__DEV__) {normalFunctionCall(test)}',
    },
  ],
  invalid: [
    {
      code: 'warningWithoutStack(test)',
      errors: [
        {
          message: 'Wrap warningWithoutStack in a `if (__DEV__)` check',
        },
      ],
    },
    {
      code: 'if (potato) {warningWithoutStack(test)}',
      errors: [
        {
          message: 'Wrap warningWithoutStack in a `if (__DEV__)` check',
        },
      ],
    },
    {
      code: 'warning(test)',
      errors: [
        {
          message: 'Wrap warning in a `if (__DEV__)` check',
        },
      ],
    },
  ],
});
