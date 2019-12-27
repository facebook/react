/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = function stripUnusedImports(pureExternalModules) {
  return {
    name: 'scripts/rollup/plugins/strip-unused-imports',
    transformBundle(code) {
      pureExternalModules.forEach(module => {
        // Ideally this would use a negative lookbehind: (?<!= *)
        // But this isn't supported by the Node <= 8.9.
        // So instead we try to handle the most common cases:
        // 1. foo,bar=require("bar"),baz
        // 2. foo;bar = require('bar');baz
        // 3.   require('bar');
        const regExp = new RegExp(
          `([,;]| {2})require\\(["']${module}["']\\)[,;]`,
          'g'
        );
        code = code.replace(regExp, '$1');
      });
      return {code};
    },
  };
};
