/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const LOGGER_FN_NAMES = [
  'warning',
  'warningWithoutStack',
  'lowPriorityWarning',
  'lowPriorityWarningWithoutStack',
];

module.exports = function(context) {
  function isInDEVBlock(node) {
    let done = false;
    while (!done) {
      let parent = node.parent;
      if (!parent) {
        return false;
      }
      if (
        parent.type === 'IfStatement' &&
        node === parent.consequent &&
        parent.test.type === 'Identifier' &&
        // This is intentionally strict so we can
        // see blocks of DEV-only code at once.
        parent.test.name === '__DEV__'
      ) {
        return true;
      }
      node = parent;
    }
  }

  function report(node) {
    context.report({
      node: node,
      message: `Wrap {{identifier}}() in an "if (__DEV__) {}" check`,
      data: {
        identifier: node.callee.name,
      },
      fix: function(fixer) {
        return [
          fixer.insertTextBefore(node.parent, `if (__DEV__) {`),
          fixer.insertTextAfter(node.parent, '}'),
        ];
      },
    });
  }

  const isLoggerFunctionName = name => LOGGER_FN_NAMES.includes(name);

  return {
    meta: {
      fixable: 'code',
    },
    CallExpression: function(node) {
      if (!isLoggerFunctionName(node.callee.name)) {
        return;
      }
      if (!isInDEVBlock(node)) {
        report(node);
      }
    },
  };
};
