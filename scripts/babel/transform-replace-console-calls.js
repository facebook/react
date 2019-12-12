/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const helperModuleImports = require('@babel/helper-module-imports');

module.exports = function replaceConsoleCalls(babel) {
  let consoleErrors = new WeakMap();
  function getConsoleError(path, file, opts) {
    if (!consoleErrors.has(file)) {
      consoleErrors.set(
        file,
        helperModuleImports.addNamed(
          path,
          'error',
          'shared/consoleWithStackDev',
          {nameHint: 'consoleError'}
        )
      );
    }
    return babel.types.cloneDeep(consoleErrors.get(file));
  }

  let consoleWarns = new WeakMap();
  function getConsoleWarn(path, file, opts) {
    if (!consoleWarns.has(file)) {
      consoleWarns.set(
        file,
        helperModuleImports.addNamed(
          path,
          'warn',
          'shared/consoleWithStackDev',
          {nameHint: 'consoleWarn'}
        )
      );
    }
    return babel.types.cloneDeep(consoleWarns.get(file));
  }

  return {
    visitor: {
      CallExpression: function(path, pass) {
        if (path.node.callee.type !== 'MemberExpression') {
          return;
        }
        if (path.node.callee.property.type !== 'Identifier') {
          // Don't process calls like console['error'](...)
          // because they serve as an escape hatch.
          return;
        }
        if (path.get('callee').matchesPattern('console.error')) {
          const id = getConsoleError(path, pass.file, this.opts);
          path.node.callee = id;
        }
        if (path.get('callee').matchesPattern('console.warn')) {
          const id = getConsoleWarn(path, pass.file, this.opts);
          path.node.callee = id;
        }
      },
    },
  };
};
