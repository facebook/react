/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

module.exports = {
  meta: {
    schema: [],
  },
  create(context) {
    function report(node, name, msg) {
      context.report(node, `Do not use the ${name} constructor. ${msg}`);
    }

    function check(node) {
      const name = node.callee.name;
      switch (name) {
        case 'Boolean':
          report(
            node,
            name,
            'To cast a value to a boolean, use double negation: !!value'
          );
          break;
        case 'String':
          if (node.type === 'NewExpression') {
            context.report(
              node,
              "Do not use `new String()`. Use String() without new (or '' + value for perf-sensitive code)."
            );
          }
          break;
        case 'Number':
          report(
            node,
            name,
            'To cast a value to a number, use the plus operator: +value'
          );
          break;
      }
    }

    return {
      CallExpression: check,
      NewExpression: check,
    };
  },
};
