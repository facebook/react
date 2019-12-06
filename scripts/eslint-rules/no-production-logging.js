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
const DEV_EXPRESSION = '__DEV__';

module.exports = function(context) {
  function traverseIf(node) {
    switch (node.type) {
      case 'Identifier':
        return [node.name];
      case 'LogicalExpression':
        if (node.operator === '&&') {
          return [...traverseIf(node.left), ...traverseIf(node.right)];
        }
        return [];
      default:
        return [];
    }
  }

  function hasIfInParents(node) {
    let done = false;
    while (!done) {
      if (!node.parent) {
        return false;
      }
      node = node.parent;
      if (
        node.type === 'IfStatement' &&
        traverseIf(node.test).includes(DEV_EXPRESSION)
      ) {
        return true;
      }
    }
  }

  function report(node) {
    context.report({
      node: node,
      message: `We don't emit warnings in production builds. Wrap {{identifier}}() in an "if (${DEV_EXPRESSION}) {}" check`,
      data: {
        identifier: node.callee.name,
      },
      fix: function(fixer) {
        return [
          fixer.insertTextBefore(node.parent, `if (${DEV_EXPRESSION}) {`),
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
      if (!hasIfInParents(node)) {
        report(node);
      }
    },
  };
};
