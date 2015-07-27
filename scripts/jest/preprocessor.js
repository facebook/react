'use strict';

var babel = require('babel');
var coffee = require('coffee-script');

var tsPreprocessor = require('./ts-preprocessor');

var defaultLibraries = [
  require.resolve('./jest.d.ts'),
  require.resolve('../../src/isomorphic/modern/class/React.d.ts'),
];

var ts = tsPreprocessor(defaultLibraries);

// This assumes the module map has been built. This might not be safe.
// We should consider consuming this from a built fbjs module from npm.
var moduleMap = require('fbjs/module-map');
var babelPluginDEV = require('fbjs/scripts/babel/dev-expression');
var babelPluginModules = require('fbjs/scripts/babel/rewrite-modules');

module.exports = {
  process: function(src, path) {
    if (path.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    if (path.match(/\.ts$/) && !path.match(/\.d\.ts$/)) {
      return ts.compile(src, path);
    }
    // TODO: make sure this stays in sync with gulpfile
    if (!path.match(/\/node_modules\//) && !path.match(/\/third_party\//)) {
      var rv = babel.transform(src, {
        nonStandard: true,
        blacklist: [
          'spec.functionName',
          'validation.react',
        ],
        optional: [
          'es7.trailingFunctionCommas',
        ],
        plugins: [babelPluginDEV, babelPluginModules],
        ignore: ['third_party'],
        filename: path,
        retainLines: true,
        _moduleMap: moduleMap,
      }).code;
      return rv;
    }
    return src;
  },
};
