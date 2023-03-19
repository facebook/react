/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = function disableTreeshake() {
  return {
    name: 'scripts/rollup/plugins/disable-treeshake',
    transform(code, id) {
      if (id.endsWith('DOMProperty.js')) {
        return {
          code,
          map: null,
          moduleSideEffects: 'no-treeshake',
        };
      }
      return null;
    },
  };
};
