/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const helperModuleImports = require('@babel/helper-module-imports');

module.exports = function autoImporter(babel) {
  function getAssignIdentifier(path, file, state) {
    // If identifier already generated, return it
    if (state.identifier) {
      return state.identifier;
    }

    // Otherwise, generate a new identifier using helper-module-imports
    state.identifier = helperModuleImports.addDefault(path, 'shared/assign', {
      nameHint: 'assign',
    });

    return state.identifier;
  }

  return {
    pre() {
      // Initialize identifier to null
      this.identifier = null;
    },

    visitor: {
      CallExpression(path, file) {
        // Ignore if transforming shared/assign
        if (/shared(\/|\\)assign/.test(file.filename)) {
          return;
        }

        // Replace Object.assign with the generated identifier
        if (path.get('callee').matchesPattern('Object.assign')) {
          const identifier = getAssignIdentifier(path, file, this);
          path.node.callee = identifier;
        }
      },

      MemberExpression(path, file) {
        // Ignore if transforming shared/assign
        if (/shared(\/|\\)assign/.test(file.filename)) {
          return;
        }

        // Replace Object.assign with the generated identifier
        if (path.matchesPattern('Object.assign')) {
          const identifier = getAssignIdentifier(path, file, this);
          path.replaceWith(identifier);
        }
      },
    },
  };
};

    },
  };
};
