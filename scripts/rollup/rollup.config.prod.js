/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var babel = require('rollup-plugin-babel');
var replace = require('rollup-plugin-replace');
var resolve = require('rollup-plugin-node-resolve');
var uglify = require('rollup-plugin-uglify');

var babelEs6ModulifyPlugin = require('../babel/transform-es6-modulify');

module.exports = {
  dest: 'build/react.rollup.prod.js',
  entry: 'build/modules/ReactUMDEntry.js',
  moduleName: 'React',
  format: 'umd',
  plugins: [
    babel({
      babelrc: false,
      plugins: [babelEs6ModulifyPlugin],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    resolve({
      main: true,
    }),
    uglify(),
  ],
  sourceMap: false,
};
