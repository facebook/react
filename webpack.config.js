'use strict';

var fs = require('fs');
var path = require('path');

var glob = require('glob');
var webpack = require('webpack');

function buildHasteMap(root) {
  var hasteMap = {};
  glob.sync(root + '/**/*.{js,css}').forEach(function(file) {
    var code = fs.readFileSync(file);
    var regex = /@providesModule ([^\s*]+)/;
    var result = regex.exec(code);
    if (result) {
      var id = result[1];
      if (path.extname(file) === '.css') {
        id += '.css';
      }
      hasteMap[id] = file;
    }
  });
  return hasteMap;
}

function resolve() {
  // Run in the context of webpack's compiler.
  var hasteMap = buildHasteMap('src');
  this.resolvers.normal.plugin('module', function(request, callback) {
    var hastePath = hasteMap[request.request];
    if (hastePath) {
      return callback(null, {
        path: hastePath,
        query: request.query,
        file: true,
        resolved: true
      });
    }
    return callback();
  });
}

function getWebpackConfig(env, entry) {
  var plugins = [
    resolve,
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify(env)}
    }),
    new webpack.BannerPlugin(
      'React v' + require('./package.json').version +
      (
        // In the dev build, each file has a copyright header so we don't need
        // a separate one at the top, but in production we add the license
        // header
        env === 'production' ?
        '\n\n' +
        'Copyright 2013-2014 Facebook, Inc.\n' +
        '\n' +
        'Licensed under the Apache License, Version 2.0 (the "License");\n' +
        'you may not use this file except in compliance with the License.\n' +
        'You may obtain a copy of the License at\n' +
        '\n' +
        'http://www.apache.org/licenses/LICENSE-2.0\n' +
        '\n' +
        'Unless required by applicable law or agreed to in writing, software\n' +
        'distributed under the License is distributed on an "AS IS" BASIS,\n' +
        'WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
        'See the License for the specific language governing permissions and\n' +
        'limitations under the License.' :
        ''
      )
    ),
  ];
  if (env === 'production') {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {warnings: false}
    }));
  }
  return {
    cache: true,
    entry: entry,
    output: {
      path: 'build',
      filename: '[name]',
      library: 'React',
      libraryTarget: 'umd'
    },
    plugins: plugins,
    module: {
      loaders: [
        {
          test: /\.js$/,
          // https://github.com/webpack/webpack/issues/119
          loader: path.join(__dirname, 'webpack-jsx-internal-loader.js')
        }
      ]
    },
  };
}

module.exports = [
  getWebpackConfig('development', {
    'react.js': ['React'],
    'react-with-addons.js': ['ReactWithAddons'],
    'JSXTransformer.js': ['./vendor/browser-transforms.js'],
  }),
  getWebpackConfig('production', {
    'react.min.js': ['React'],
    'react-with-addons.min.js': ['ReactWithAddons']
  }),
];
