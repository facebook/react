/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

/**
 * Babel plugin to replace JSX imports with lazy loading to prevent issues
 * with the JSX runtime during testing.
 */
module.exports = function replaceJSXImportWithLazy(babel) {
  const { types: t } = babel;

  /**
   * Generates a require call expression for the specified module.
   * @param {string} moduleName - The name of the module to require.
   * @returns {Object} - A call expression for requiring the module.
   */
  function getInlineRequire(moduleName) {
    return t.callExpression(t.identifier('require'), [
      t.stringLiteral(moduleName),
    ]);
  }

  /**
   * Replaces the callee of the JSX function with the appropriate lazy loaded module.
   * @param {Object} path - The Babel path for the current node.
   * @param {string} moduleName - The module name for the JSX function.
   * @param {string} method - The method name to replace (jsx, jsxs, jsxDEV).
   */
  function replaceCallee(path, moduleName, method) {
    path.node.callee = t.memberExpression(
      getInlineRequire(moduleName),
      t.identifier(method)
    );
  }

  return {
    visitor: {
      CallExpression(path) {
        let callee = path.node.callee;

        // Handle SequenceExpression to get the last expression
        if (callee.type === 'SequenceExpression') {
          callee = callee.expressions[callee.expressions.length - 1];
        }

        // Handle cases for different JSX function names
        if (callee.type === 'Identifier') {
          switch (callee.name) {
            case '_jsxDEV':
              replaceCallee(path, 'react/jsx-dev-runtime', 'jsxDEV');
              return;
            case '_jsx':
              replaceCallee(path, 'react/jsx-runtime', 'jsx');
              return;
            case '_jsxs':
              replaceCallee(path, 'react/jsx-runtime', 'jsxs');
              return;
          }
          return; // Exit if no match found
        }

        // Check for MemberExpression for more complex JSX calls
        if (callee.type !== 'MemberExpression') {
          return;
        }

        if (callee.property.type !== 'Identifier') {
          // Needs to be jsx, jsxs, jsxDEV.
          return;
        }

        if (callee.object.type !== 'Identifier') {
          // Needs to be _reactJsxDevRuntime or _reactJsxRuntime.
          return;
        }

        // Replace cached identifier with a new require call
        switch (callee.object.name) {
          case '_reactJsxDevRuntime':
          case '_jsxDevRuntime':
            callee.object = getInlineRequire('react/jsx-dev-runtime');
            return;
          case '_reactJsxRuntime':
          case '_jsxRuntime':
            callee.object = getInlineRequire('react/jsx-runtime');
            return;
          default:
            console.warn(`Warning: Unrecognized object name ${callee.object.name}`);
        }
      },
    },
  };
};
