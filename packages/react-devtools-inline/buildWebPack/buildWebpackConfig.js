import { mode, devtool, entryPoints, path, publicPath, filename, chunkFilename, library } from './env/envBuild';


export function buildWebpackConfig({ mode, devtool, entryPoints, output, plugins, rules, resolve, externals, optimization, node }) {
    return {
      mode,
      devtool,
      entry: entryPoints,
      output,
      plugins,
      module: {
        rules,
      },
      resolve,
      externals,
      optimization,
      node,
    };
  }
  