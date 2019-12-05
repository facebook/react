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
    /* wrapped calls */
    {
      code: 'if (__DEV__) { warningWithoutStack(test) }',
    },
    {
      code: 'if (__DEV__) { warning(test) }',
    },
    /* calls wrapped on an outer bound */
    {
      code: 'if (__DEV__) { if (potato) { while (true) { warning(test) } } }',
    },
    /* calls wrapped on an if with && */
    {
      code: 'if (banana && __DEV__ && potato && kitten) { warning(test) }',
    },
    /* don't do anything to arbitrary fn's or invariants */
    {
      code: 'normalFunctionCall(test)',
    },
    {
      code: 'invariant(test)',
    },
  ],
  invalid: [
    {
      code: 'warningWithoutStack(test)',
      errors: [
        {
          message: `We don't emit warnings in production builds. Wrap warningWithoutStack() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: 'if (potato) { warningWithoutStack(test) }',
      errors: [
        {
          message: `We don't emit warnings in production builds. Wrap warningWithoutStack() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: 'warning(test)',
      errors: [
        {
          message: `We don't emit warnings in production builds. Wrap warning() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: 'if (__DEV__ || potato && true) { warning(test) }',
      errors: [
        {
          message: `We don't emit warnings in production builds. Wrap warning() in an "if (__DEV__) {}" check`,
        },
      ],
    },
  ],
});
