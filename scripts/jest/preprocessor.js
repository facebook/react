'use strict';

var path = require('path');

var babel = require('babel');
var coffee = require('coffee-script');

var tsPreprocessor = require('./ts-preprocessor');

// This assumes the module map has been built. This might not be safe.
// We should consider consuming this from a built fbjs module from npm.
var moduleMap = require('fbjs/module-map');
var babelPluginDEV = require('fbjs/scripts/babel/dev-expression');
var babelPluginModules = require('fbjs/scripts/babel/rewrite-modules');

module.exports = {
  process: function(src, filePath) {
    if (filePath.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    if (filePath.match(/\.ts$/) && !filePath.match(/\.d\.ts$/)) {
      return tsPreprocessor.compile(src, filePath);
    }
    // TODO: make sure this stays in sync with gulpfile
    if (!filePath.match(/\/node_modules\//) &&
        !filePath.match(/\/third_party\//)) {
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
        filename: filePath,
        retainLines: true,
        _moduleMap: moduleMap,
      }).code;

      // hax to turn fbjs/lib/foo into /path/to/node_modules/fbjs/lib/foo
      // because jest is slooow with node_modules paths (facebook/jest#465)
      rv = rv.replace(
        /require\('(fbjs\/lib\/.+)'\)/g,
        function(call, arg) {
          return (
            'require(' +
            JSON.stringify(
              path.join(__dirname, '../../node_modules', arg)
            ) +
            ')'
          );
        }
      );

      return rv;
    }
    return src;
  },
};
