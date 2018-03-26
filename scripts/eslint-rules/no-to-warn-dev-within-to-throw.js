/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

module.exports = function(context) {
  return {
    Identifier(node) {
      if (node.name === 'toWarnDev') {
        let current = node;
        while (current.parent) {
          if (current.type === 'CallExpression') {
            if (
              current &&
              current.callee &&
              current.callee.property &&
              current.callee.property.name === 'toThrow'
            ) {
              context.report(node, 'toWarnDev() matcher should not be nested');
            }
          }
          current = current.parent;
        }
      }
    },
  };
};
