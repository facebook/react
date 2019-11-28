/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const gzip = require('gzip-size');

module.exports = function sizes(options) {
  return {
    name: 'scripts/rollup/plugins/sizes-plugin',
    generateBundle(bundle, obj) {
      const code = Object.keys(obj)
        .map(key => obj[key].code)
        .join('\n');

      const size = Buffer.byteLength(code);
      const gzipSize = gzip.sync(code);

      options.getSize(size, gzipSize);
    },
  };
};
