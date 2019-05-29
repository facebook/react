/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const fs = require('fs');
const path = require('path');
const existingErrorMap = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../error-codes/codes.json'))
);
const messages = new Set();
Object.keys(existingErrorMap).forEach(key =>
  messages.add(existingErrorMap[key])
);

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
      const l = getLiteralString(node.left);
      const r = getLiteralString(node.right);
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
      const isWarningOrInvariant =
        node.callee.type === 'Identifier' &&
        (node.callee.name === 'warning' ||
          node.callee.name === 'warningWithoutStack' ||
          node.callee.name === 'invariant');
      if (!isWarningOrInvariant) {
        return;
      }
      if (node.arguments.length < 2) {
        context.report(node, '{{name}} takes at least two arguments', {
          name: node.callee.name,
        });
        return;
      }
      const format = getLiteralString(node.arguments[1]);
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
      const expectedNArgs = (format.match(/%s/g) || []).length + 2;
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

      if (node.callee.name === 'invariant') {
        if (!messages.has(format)) {
          context.report(
            node,
            'Error message does not have a corresponding production ' +
              'error code.\n\n' +
              'Run `yarn extract-errors` to add the message to error code ' +
              'map, so it can be stripped from the production builds. ' +
              "Alternatively, if you're updating an existing error " +
              'message, you can modify ' +
              '`scripts/error-codes/codes.json` directly.'
          );
        }
      }
    },
  };
};

module.exports.schema = [];
