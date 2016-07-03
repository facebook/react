/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = function(babel) {
  const t = babel.types;

  return {
    visitor: {
      CallExpression: function(path, file) {
        // TODO: support RHS member expression and LHS destructuring
        if (
          !t.isIdentifier(path.node.callee, {name: 'require'}) ||
          !t.isVariableDeclarator(path.parent) || // not an assignment
          path.scope.path.type !== 'Program' // is top-level
        ) {
          return;
        }

        // instead of calling `replaceWith`, this handles cases like
        // `var m0 = require('m0'), m1 = require('m1');`
        // we don't have this pattern in the code base but
        // it happens when Babel inserts requires
        path.parentPath.parentPath.insertBefore(
          t.importDeclaration(
            [t.importDefaultSpecifier(path.parent.id)],
            path.node.arguments[0]
          )
        );
        path.parentPath.remove();
      },

      AssignmentExpression: function(path, file) {
        if (
          !path.get('left').matchesPattern('module.exports') ||
          path.scope.path.type !== 'Program' // is top-level
        ) {
          return;
        }

        // TODO: use FunctionDeclaration and ClassDeclaration
        // and don't make everything an Expression
        let rhs = path.node.right;

        path.parentPath.replaceWith(
          t.exportDefaultDeclaration(
            rhs
          )
        );
      },
    },
  };
};
