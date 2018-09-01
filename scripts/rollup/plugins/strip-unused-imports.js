/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = function sizes(pureExternalModules) {
  return {
    name: 'scripts/rollup/plugins/strip-unused-imports',
    transformBundle(code) {
      pureExternalModules.forEach(module => {
        const regExp = new RegExp(
          `(?<!= *)require\\(["']${module}["']\\)[,;]`,
          'g'
        );
        code = code.replace(regExp, '');
      });
      return {code};
    },
  };
};
