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
  function hasIfInParents(node) {
    let done = false;
    while (!done) {
      if (!node.parent) {
        return false;
      }
      node = node.parent;
      if (node.type === 'IfStatement' && node.test.name === '__DEV__') {
        return true;
      }
    }
  }

  const isLoggerNode = name => ['consoleLog', 'consoleError'].includes(name);

  return {
    CallExpression: node => {
      if (!isLoggerNode(node.callee.name)) {
        return;
      }
      if (!hasIfInParents(node)) {
        context.report({
          node: node,
          message: 'Wrap {{identifier}} in a `if (__DEV__)` check',
          data: {
            identifier: node.callee.name,
          },
        });
      }
    },
  };
};
