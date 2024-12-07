const { resolve } = require('path');
const { resolveFeatureFlags } = require('react-devtools-shared/buildUtils');

import { mode, devtool, entryPoints, path, publicPath, filename, chunkFilename, library } from './env/envBuild';
import { buildRules } from './buildWebPack/rules/buildRules';
import { buildPlugins } from './buildWebPack/plugins/buildPlugins';
import { buildWebpackConfig } from './buildWebPack/buildWebpackConfig';

const output = {
  path,
  publicPath,
  filename,
  chunkFilename,
  library,
};

const webpackConfig = buildWebpackConfig({
  mode,
  devtool,
  entryPoints,
  output,
  plugins: buildPlugins,
  rules: buildRules,
  resolve: {
    alias: {
      'react-devtools-feature-flags': resolveFeatureFlags('inline'),
    },
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'react-dom/client': 'react-dom/client',
    'react-is': 'react-is',
    scheduler: 'scheduler',
  },
  optimization: {
    minimize: false,
  },
  node: {
    global: false,
  },
});

module.exports = webpackConfig;
