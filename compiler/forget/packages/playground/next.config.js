/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
