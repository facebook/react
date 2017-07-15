function getCustomConfig(prod) {
  return {
    presets: [],
    babelPlugins: [],
    plugins: [],
    loaders: [],
    values: {},
    excludedFilesRegex: []
  }
}

module.exports = getCustomConfig;
