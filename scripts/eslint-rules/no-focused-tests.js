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
  function check(node) {
    const name = node.callee.name;

    if (name === 'fdescribe' || name === 'fit') {
      context.report(node, 'Focused tests are not allowed.');
    }
  }

  return {
    CallExpression: check,
  };
};
