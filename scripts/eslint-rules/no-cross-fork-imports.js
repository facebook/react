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

module.exports = context => {
  const sourceFilename = context.getFilename();

  if (isOldFork(sourceFilename)) {
    return {
      ImportDeclaration(node) {
        const importFilename = node.source.value;
        if (isNewFork(importFilename)) {
          context.report(
            node,
            'A module that belongs to the old fork cannot import a module ' +
              'from the new fork.'
          );
        }
      },
    };
  }

  if (isNewFork(sourceFilename)) {
    return {
      ImportDeclaration(node) {
        const importFilename = node.source.value;
        if (isOldFork(importFilename)) {
          context.report(
            node,
            'A module that belongs to the new fork cannot import a module ' +
              'from the old fork.'
          );
        }
      },
    };
  }

  return {};
};
