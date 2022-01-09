/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-cross-fork-types');
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
});

const newAccessWarning =
  'Field cannot be accessed inside the old reconciler fork, only the ' +
  'new fork.';

const oldAccessWarning =
  'Field cannot be accessed inside the new reconciler fork, only the ' +
  'old fork.';

ruleTester.run('eslint-rules/no-cross-fork-types', rule, {
  valid: [
    {
      code: `
const a = obj.key_old;
const b = obj.key_new;
const {key_old, key_new} = obj;
`,
      filename: 'ReactFiberWorkLoop.js',
    },
    {
      code: `
const a = obj.key_old;
const {key_old} = obj;
`,
      filename: 'ReactFiberWorkLoop.old.js',
    },
    {
      code: `
const a = obj.key_new;
const {key_new} = obj;
`,
      filename: 'ReactFiberWorkLoop.new.js',
    },
  ],
  invalid: [
    {
      code: 'const a = obj.key_new;',
      filename: 'ReactFiberWorkLoop.old.js',
      errors: [{message: newAccessWarning}],
    },
    {
      code: 'const a = obj.key_old;',
      filename: 'ReactFiberWorkLoop.new.js',
      errors: [{message: oldAccessWarning}],
    },

    {
      code: 'const {key_new} = obj;',
      filename: 'ReactFiberWorkLoop.old.js',
      errors: [{message: newAccessWarning}],
    },
    {
      code: 'const {key_old} = obj;',
      filename: 'ReactFiberWorkLoop.new.js',
      errors: [{message: oldAccessWarning}],
    },
    {
      code: 'const subtreeFlags = obj.subtreeFlags;',
      filename: 'ReactFiberWorkLoop.old.js',
      options: [{new: ['subtreeFlags']}],
      errors: [{message: newAccessWarning}],
    },
    {
      code: 'const firstEffect = obj.firstEffect;',
      filename: 'ReactFiberWorkLoop.new.js',
      options: [{old: ['firstEffect']}],
      errors: [{message: oldAccessWarning}],
    },
  ],
});
