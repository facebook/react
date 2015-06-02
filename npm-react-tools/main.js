/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var jstransform = require('jstransform/simple');

function transformWithDetails(code, opts) {
  opts = opts || {};

  // Copy out the values we need and make sure they are compatible with
  // jstransform options. Always set react:true.
  var options = {
    react: true,
    harmony: opts.harmony,
    stripTypes: opts.stripTypes,
    sourceMapInline: opts.sourceMap,
    sourceFilename: opts.sourceFilename,
    es6module: opts.es6module,
    nonStrictEs6module: opts.nonStrictEs6module,
    target: opts.target,
  };

  return jstransform.transform(code, options);
}

module.exports = {
  transform: function(input, options) {
    return transformWithDetails(input, options).code;
  },
  transformWithDetails: transformWithDetails,
};
