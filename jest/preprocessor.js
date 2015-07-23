'use strict';

var babel = require('babel');
var coffee = require('coffee-script');
var ts = require('typescript');

module.exports = {
  process: function(src, path) {
    if (path.match(/\.coffee$/)) {
      return coffee.compile(src, {'bare': true});
    }
    if (path.match(/\.ts$/) && !path.match(/\.d\.ts$/)) {
      return ts.transpile(src, {module: ts.ModuleKind.CommonJS});
    }
    if (!path.match(/\/node_modules\//) && !path.match(/\/third_party\//)) {
      return babel.transform(src, {
        blacklist: ['spec.functionName', 'validation.react'],
        filename: path,
        retainLines: true,
      }).code;
    }
    return src;
  },
};
