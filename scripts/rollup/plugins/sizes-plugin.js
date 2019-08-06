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
    generateBundle(outputOptions, bundle, isWrite) {
      Object.keys(bundle).forEach(id => {
        const chunk = bundle[id];
        if (chunk) {
          const size = Buffer.byteLength(chunk.code);
          const gzipSize = gzip.sync(chunk.code);
          options.getSize(size, gzipSize);
        }
      });
    },
  };
};
