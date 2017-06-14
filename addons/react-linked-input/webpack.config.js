/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const webpack = require('webpack');

let __DEV__;
switch (process.env.NODE_ENV) {
  case 'development':
    __DEV__ = true;
    break;
  case 'production':
    __DEV__ = false;
    break;
  default:
    throw new Error('Unknown environment.');
}

module.exports = {
  entry: './index',
  output: {
    library: 'LinkedInput',
    libraryTarget: 'umd',
    filename: __DEV__ ? 'react-linked-input.js' : 'react-linked-input.min.js'
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': __DEV__ ? '"development"' : '"production"'
    })
  ].concat(
    __DEV__
      ? []
      : [
          new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: false
            },
            output: {
              comments: false
            }
          })
        ]
  )
};
