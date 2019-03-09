/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

/**
 * The warning() and invariant() functions take format strings as their second
 * argument.
 */

function isStringOrTemplateConcatenation(node) {
  switch (node.type) {
    case 'Literal':
    case 'TemplateLiteral':
      return true;
    case 'BinaryExpression':
      return (
        isStringOrTemplateConcatenation(node.left) &&
        isStringOrTemplateConcatenation(node.right)
      );
  }
}

module.exports = function(context) {
  function CallOrNewExpression(node) {
    if (node.callee.name === 'Error') {
      if (node.arguments.length === 0) {
        return;
      }
      if (node.arguments.length !== 1) {
        context.report(
          node,
          'Too many arguments passed to ' + node.callee.name + '.'
        );
        return;
      }
      const messageNode = node.arguments[0];
      if (!isStringOrTemplateConcatenation(messageNode)) {
        let parent = node.parent;
        while (parent != null) {
          const statementParent = parent;
          const leadingComments = context.getComments(statementParent).leading;
          for (let i = 0; i < leadingComments.length; i++) {
            const comment = leadingComments[i];
            if (comment.value.trim() === 'extract-errors/skip') {
              // Skip this error message
              return;
            }
          }
          parent = parent.parent;
        }
        context.report(
          node,
          'Error messages should be composed only of string literals. Use ' +
            'a template literal to interpolate dynamic values.'
        );
      }
    }
  }

  return {
    NewExpression: CallOrNewExpression,
    CallExpression: CallOrNewExpression,
  };
};

module.exports.schema = [];
