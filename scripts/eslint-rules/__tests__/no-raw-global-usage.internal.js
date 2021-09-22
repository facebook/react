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
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester();

ruleTester.run('no-production-logging', rule, {
  valid: [
    {
      code: `
        import {window} from 'shared/Globals';
        if (window) {
            var data = window.clipboardData
        }
      `,
    },
  ],
  invalid: [
    {
      code: "window.addEventListener('click', (e) => {})",
      errors: [
        {
          message:
            'Unexpected use of window. Please import addEventListener from ' +
            'shared/Globals to ensure safe access.',
        },
      ],
    },
  ],
});
