/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function autoImporter(babel) {
  const t = babel.types;

  function isObjectAssign(file) {
    var filename = file.opts.filename;
    return filename.indexOf('object-assign') >= 0;
  }

  function getAssignIdent(path, state) {
    if (!state.id) {
      state.id = path.scope.generateUidIdentifier('assign');
      path.scope.getProgramParent().push({
        id: state.id,
        init: t.callExpression(
          t.identifier('require'),
          [t.stringLiteral('object-assign')]
        ),
      });
    }
    return state.id;
  }

  return {
    pre: function() {
      // map from module to generated identifier
      this.id = null;
    },

    visitor: {
      CallExpression: function(path, state) {
        if (isObjectAssign(state.file)) { return }
        if (path.get('callee').matchesPattern('Object.assign')) {
          // generate identifier and require if it hasn't been already
          var id = getAssignIdent(path, state);
          path.node.callee = id;
        }
      },

      MemberExpression: function(path, state) {
        if (isObjectAssign(state.file)) { return }
        if (path.matchesPattern('Object.assign')) {
          var id = getAssignIdent(path, state);
          path.replaceWith(id);
        }
      },
    },
  };
};
