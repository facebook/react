/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

module.exports = function(context) {
  // we also allow literal strings and concatenated literal strings
  function getLiteralString(node) {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      return node.value;
    } else if (node.type === 'BinaryExpression' && node.operator === '+') {
      var l = getLiteralString(node.left);
      var r = getLiteralString(node.right);
      if (l !== null && r !== null) {
        return l + r;
      }
    }
    return null;
  }

  return {
    CallExpression: function(node) {
      // This could be a little smarter by checking context.getScope() to see
      // how warning/invariant was defined.
      var isWarningOrInvariant =
        node.callee.type === 'Identifier' &&
        (node.callee.name === 'warning' || node.callee.name === 'invariant');
      if (!isWarningOrInvariant) {
        return;
      }
      if (node.arguments.length < 2) {
        context.report(node, '{{name}} takes at least two arguments', {
          name: node.callee.name,
        });
        return;
      }
      var format = getLiteralString(node.arguments[1]);
      if (format === null) {
        context.report(
          node,
          'The second argument to {{name}} must be a string literal',
          {name: node.callee.name}
        );
        return;
      }
      if (format.length < 10 || /^[s\W]*$/.test(format)) {
        context.report(
          node,
          'The {{name}} format should be able to uniquely identify this ' +
            '{{name}}. Please, use a more descriptive format than: {{format}}',
          {name: node.callee.name, format: format}
        );
        return;
      }
      // count the number of formatting substitutions, plus the first two args
      var expectedNArgs = (format.match(/%s/g) || []).length + 2;
      if (node.arguments.length !== expectedNArgs) {
        context.report(
          node,
          'Expected {{expectedNArgs}} arguments in call to {{name}} based on ' +
            'the number of "%s" substitutions, but got {{length}}',
          {
            expectedNArgs: expectedNArgs,
            name: node.callee.name,
            length: node.arguments.length,
          }
        );
      }
    },
  };
};

module.exports.schema = [];
