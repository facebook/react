/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function isOldFork(filename) {
  return filename.endsWith('.old.js') || filename.endsWith('.old');
}

function isNewFork(filename) {
  return filename.endsWith('.new.js') || filename.endsWith('.new');
}

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code',
  },
  create(context) {
    const sourceFilename = context.getFilename();

    if (isOldFork(sourceFilename)) {
      return {
        ImportDeclaration(node) {
          const importSourceNode = node.source;
          const filename = importSourceNode.value;
          if (isNewFork(filename)) {
            context.report({
              node: importSourceNode,
              message:
                'A module that belongs to the old fork cannot import a module ' +
                'from the new fork.',
              fix(fixer) {
                return fixer.replaceText(
                  importSourceNode,
                  `'${filename.replace(/\.new(\.js)?$/, '.old')}'`
                );
              },
            });
          }
        },
      };
    }

    if (isNewFork(sourceFilename)) {
      return {
        ImportDeclaration(node) {
          const importSourceNode = node.source;
          const filename = importSourceNode.value;
          if (isOldFork(filename)) {
            context.report({
              node: importSourceNode,
              message:
                'A module that belongs to the new fork cannot import a module ' +
                'from the old fork.',
              fix(fixer) {
                return fixer.replaceText(
                  importSourceNode,
                  `'${filename.replace(/\.old(\.js)?$/, '.new')}'`
                );
              },
            });
          }
        },
      };
    }

    return {};
  },
};
