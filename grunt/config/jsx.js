'use strict';

var assign = require('../../src/shared/stubs/Object.assign');
var grunt = require('grunt');

var rootIDs = [
  'React',
  'ReactWithAddons',
  // deprecated is used in the npm package but not anywhere else, so build it.
  'deprecated',
];

var normal = {
  rootIDs: rootIDs,
  getConfig: function() {
    return {
      commonerConfig: grunt.config.data.pkg.commonerConfig,
    };
  },
  sourceDir: 'src',
  outputDir: 'build/modules',
};


var test = {
  rootIDs: rootIDs.concat([
    'test/all.js',
    '**/__tests__/*.js',
  ]),
  getConfig: function() {
    return assign({}, normal.getConfig(), {
      mocking: true,
    });
  },
  sourceDir: 'src',
  outputDir: 'build/modules',
};


module.exports = {
  normal: normal,
  test: test,
};
