/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var basename = require('path').basename;

function getFileLoc(path, file) {
  if (file.file.opts.filename === 'unknown') {
    return '';
  }
  var startLinePos = path.node.loc.start.line;
  var fileName = file.file.opts.filename;
  var moduleName = basename(fileName);
  return (
    'Check line ' + startLinePos + ' at `' + fileName +
    '` and the original `' + moduleName + '` module under `/src`.'
  );
}

module.exports = function(babel) {
  var t = babel.types;

  return {
    visitor: {
      CallExpression: function(path, file) {
        if (!t.isIdentifier(path.node.callee, {name: 'require'})) {
          return;
        }

        var sourceLocText = getFileLoc(path, file);
        if (t.isMemberExpression(path.parent)) {
          // `var createElement = require('react').createElement;`
          throw new Error(
            'Invalid require: `require()` must be in the form of `var ... = require(...);`. ' + sourceLocText
          );
        } else if (!t.isVariableDeclarator(path.parent)) {
          // is not directly in a VariableDeclarator
          throw new Error(
            'Invalid require: `require()` must be directly in a variable declarator. ' + sourceLocText
          );
        } else if (!t.isProgram(path.scope.block)) {
          // is not on the top-level
          throw new Error(
            'Invalid require: `require()` must be on the top-level. ' + sourceLocText
          );
        } else if (!t.isStringLiteral(path.node.arguments[0])) {
          // the argument is not a StringLiteral
          throw new Error(
            'Invalid require: `require()` must take a literal string as argument. ' + sourceLocText
          );
        } else if (!t.isIdentifier(path.parent.id)) {
          // LHS is not an Identifier; presumably an ObjectPattern (destructuring)
          throw new Error(
            'Invalid require: left hand side of `require()` must be an identifier. ' + sourceLocText
          );
        }

        // instead of calling `replaceWith`, this handles cases like
        // `var m0 = require('m0'), m1 = require('m1');`
        // we don't have this pattern in the code base but
        // it happens when Babel inserts `require`s
        path.parentPath.parentPath.insertBefore(
          t.importDeclaration(
            [t.importDefaultSpecifier(path.parent.id)],
            path.node.arguments[0]
          )
        );
        path.parentPath.remove();
      },

      MemberExpression: function(path, file) {
        if (!path.matchesPattern('module.exports')) {
          return;
        }

        var sourceLocText = getFileLoc(path, file);
        if (
          !t.isAssignmentExpression(path.parent) ||
          path.node !== path.parent.left
        ) {
          // `module.exports` is on the RHS, or the LHS looks like `module.exports.foo`
          throw new Error(
            'Invalid exports: `module.exports` must be in the form of `module.exports = ...;`. ' + sourceLocText
          );
        } else if (!t.isProgram(path.scope.block)) {
          // is not on the top-level
          throw new Error(
            'Invalid exports: `module.exports = ...` must be on the top-level. ' + sourceLocText
          );
        }

        this.numberOfExports = this.numberOfExports ? this.numberOfExports + 1 : 1;
        if (this.numberOfExports > 1) {
          throw new Error(
            'Invalid exports: `module.exports = ...` can only happen once in a module. ' + sourceLocText
          );
        }

        path.parentPath.parentPath.replaceWith(
          // for now, it's not necessary to convert the RHS to
          // a FunctionDeclaration or a ClassDeclaration since we only export default
          // (i.e., only named exports resolve the `id` field for naming)
          t.exportDefaultDeclaration(path.parent.right)
        );
      },
    },
  };
};
