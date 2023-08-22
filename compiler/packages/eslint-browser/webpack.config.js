/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const path = require("path");
const NodePolyfillWebpackPlugin = require("node-polyfill-webpack-plugin");

// This configuration is adapted from ESLint playground:
// https://github.com/eslint/playground/blob/f3b1f78cc1c06dadfe7bb50c6c0f913c0d23670d/webpack.config.js
/** @type {import("webpack").Configuration} */
module.exports = {
  entry: "./src/index.js",
  plugins: [new NodePolyfillWebpackPlugin()],
  output: {
    library: {
      name: "index",
      type: "commonjs2",
    },
  },
  resolve: {
    extensions: [".js"],
    mainFields: ["browser", "main", "module"],
  },
};
