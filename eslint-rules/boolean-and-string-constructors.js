/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

module.exports = function(context) {
  function check(node) {
    const name = node.callee.name;
    let msg = null;
    switch (name) {
      case 'Boolean':
        msg = 'To cast a value to a boolean, use double negation: !!value';
        break;
      case 'String':
        msg = 'To cast a value to a string, concat it with the empty string: \'\' + value';
        break;
    }
    if (msg) {
      context.report(node, `Do not use the ${name} constructor. ${msg}`);
    }
  }

  return {
    CallExpression: check,
    NewExpression: check,
  };
};
