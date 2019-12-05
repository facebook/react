/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

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
        traverseIf(node.test).includes('__DEV__')
      ) {
        return true;
      }
    }
  }

  function report(node) {
    context.report({
      node: node,
      message: 'Wrap {{identifier}} in a `if (__DEV__)` check',
      data: {
        identifier: node.callee.name,
      },
      fix: function(fixer) {
        return [
          fixer.insertTextBefore(node.parent, 'if (__DEV__) {'),
          fixer.insertTextAfter(node.parent, '}'),
        ];
      },
    });
  }

  const isLoggerFunctionName = name =>
    ['warning', 'warningWithoutStack'].includes(name);

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
