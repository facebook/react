/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function reportUnexpectedGlobal(context, node) {
  context.report({
    node: node,
    message:
      'Unexpected use of {{global}}. Please import {{identifier}} from ' +
      'shared/Globals to ensure safe access.',
    data: {
      identifier: node.property.name,
      global: node.object.name,
    },
  });
}

module.exports = {
  meta: {
    schema: [],
  },
  create: function(context) {
    if (context.getFilename().endsWith('/packages/shared/Globals.js')) {
      return {};
    }
    let hasWindowImport = false;
    return {
      ImportDeclaration: function(node) {
        const source = node.source;
        if (source && source.value === 'shared/Globals') {
          if (
            node.specifiers &&
            node.specifiers.find(binding => binding.local.name === 'window')
          ) {
            hasWindowImport = true;
          }
        }
      },
      MemberExpression: function(node) {
        if (
          node.object.type === 'Identifier' &&
          ((node.object.name === 'window' && !hasWindowImport) ||
            node.object.name === 'global') &&
          node.property.type === 'Identifier'
        ) {
          reportUnexpectedGlobal(context, node);
        }
      },
    };
  },
};
