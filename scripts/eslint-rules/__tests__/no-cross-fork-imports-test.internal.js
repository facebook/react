/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-cross-fork-imports');
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
});

ruleTester.run('eslint-rules/no-cross-fork-imports', rule, {
  valid: [
    {
      code: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop';",
      filename: 'ReactFiberWorkLoop.js',
    },
    {
      code: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new';",
      filename: 'ReactFiberWorkLoop.new.js',
    },
    {
      code:
        "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new.js';",
      filename: 'ReactFiberWorkLoop.new.js',
    },
    {
      code: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old';",
      filename: 'ReactFiberWorkLoop.old.js',
    },
    {
      code:
        "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old.js';",
      filename: 'ReactFiberWorkLoop.old.js',
    },
  ],
  invalid: [
    {
      code: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new';",
      filename: 'ReactFiberWorkLoop.old.js',
      errors: [
        {
          message:
            'A module that belongs to the old fork cannot import a module ' +
            'from the new fork.',
        },
      ],
      output: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old';",
    },
    {
      code:
        "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new.js';",
      filename: 'ReactFiberWorkLoop.old.js',
      errors: [
        {
          message:
            'A module that belongs to the old fork cannot import a module ' +
            'from the new fork.',
        },
      ],
      output: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old';",
    },
    {
      code: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old';",
      filename: 'ReactFiberWorkLoop.new.js',
      errors: [
        {
          message:
            'A module that belongs to the new fork cannot import a module ' +
            'from the old fork.',
        },
      ],
      output: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new';",
    },
    {
      code:
        "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.old.js';",
      filename: 'ReactFiberWorkLoop.new.js',
      errors: [
        {
          message:
            'A module that belongs to the new fork cannot import a module ' +
            'from the old fork.',
        },
      ],
      output: "import {scheduleUpdateOnFiber} from './ReactFiberWorkLoop.new';",
    },
    {
      code: "export {DiscreteEventPriority} from './ReactFiberLane.old.js';",
      filename: 'ReactFiberReconciler.new.js',
      errors: [
        {
          message:
            'A module that belongs to the new fork cannot import a module ' +
            'from the old fork.',
        },
      ],
      output: "export {DiscreteEventPriority} from './ReactFiberLane.new';",
    },
    {
      code: "export {DiscreteEventPriority} from './ReactFiberLane.new.js';",
      filename: 'ReactFiberReconciler.old.js',
      errors: [
        {
          message:
            'A module that belongs to the old fork cannot import a module ' +
            'from the new fork.',
        },
      ],
      output: "export {DiscreteEventPriority} from './ReactFiberLane.old';",
    },
  ],
});
