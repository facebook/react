/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

function evalToString(ast /* : Object */) /* : string */ {
  switch (ast.type) {
    case 'StringLiteral':
      return ast.value;
    case 'BinaryExpression': // `+`
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return evalToString(ast.left) + evalToString(ast.right);
    default:
      throw new Error('Unsupported type ' + ast.type);
  }
}

module.exports = evalToString;
