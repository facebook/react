/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, options) => {
    // Load *.d.ts files as strings using https://webpack.js.org/guides/asset-modules/#source-assets.
    config.module.rules.push({
      test: /\.d\.ts/,
      type: "asset/source",
    });

    // Monaco Editor
    if (!options.isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["typescript", "javascript"],
          filename: "static/[name].worker.js",
        }),
      );
    }
    return config;
  },
  // These aren't used by the playground, but turning it on forces nextjs to use
  // experimental react which has the useMemoCache hook.
  experimental: {
    serverActions: true,
  },
  transpilePackages: ["monaco-editor"],
};

module.exports = nextConfig;
