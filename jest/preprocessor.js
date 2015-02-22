'use strict';

var ReactTools = require('../main.js');

var coffee = require('coffee-script');
var tsPreprocessor = require('./ts-preprocessor');

var defaultLibraries = [
  require.resolve('./jest.d.ts'),
  require.resolve('../src/modern/class/React.d.ts')
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
    return ReactTools.transform(src, {harmony: true});
  }
};
