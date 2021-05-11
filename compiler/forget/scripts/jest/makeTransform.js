/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ReactForgetBabelPlugin = require("../../dist").default;
const babelJest = require("babel-jest");

module.exports = (useForget) => {
  function createTransformer() {
    return babelJest.createTransformer({
      passPerPreset: true,
      presets: [
        "@babel/preset-typescript",
        {
          plugins: [
            "@babel/plugin-syntax-jsx",
            ...(useForget ? [ReactForgetBabelPlugin, {}] : []),
          ],
        },
        "@babel/preset-react",
        {
          plugins: ["@babel/plugin-transform-modules-commonjs"],
        },
      ],
      targets: {
        esmodules: true,
      },
    });
  }

  return {
    createTransformer,
  };
};
