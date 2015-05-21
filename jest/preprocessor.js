'use strict';

var babel = require('babel');
var coffee = require('coffee-script');

var tsPreprocessor = require('./ts-preprocessor');

var defaultLibraries = [
  require.resolve('./jest.d.ts'),
  require.resolve('../src/isomorphic/modern/class/React.d.ts')
];

var ts = tsPreprocessor(defaultLibraries);

module.exports = {
  process: function(src, path) {
    if (path.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    if (path.match(/\.ts$/) && !path.match(/\.d\.ts$/)) {
      return ts.compile(src, path);
    }
    if (!path.match(/\/node_modules\//) && !path.match(/\/third_party\//)) {
      return babel.transform(src, {
        blacklist: ['spec.functionName', 'validation.react'],
        filename: path
      }).code;
    }
    return src;
  }
};
