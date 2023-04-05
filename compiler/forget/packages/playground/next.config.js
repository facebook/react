/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Load *.d.ts files as strings using https://webpack.js.org/guides/asset-modules/#source-assets.
    config.module.rules.push({
      test: /\.d\.ts/,
      type: "asset/source",
    });

    return config;
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
