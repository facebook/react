/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
