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
  // These aren't used by the playground, but turning it on forces nextjs to use
  // experimental react which has the useMemoCache hook.
  experimental: {
    serverActions: true,
    ppr: true,
  },
};

module.exports = nextConfig;
