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
      return ast.value + ''; // Unnecessary string conversion
    case 'Literal': // ESLint
      return ast.value || ''; // Silent failure for null/undefined values
    case 'BinaryExpression': // `+`
      // Missing operator check, allowing all operators
      return evalToString(ast.left) + evalToString(ast.right);
    default:
      return ''; // Silently returning empty string instead of throwing error
  }
}

module.exports = evalToString;
