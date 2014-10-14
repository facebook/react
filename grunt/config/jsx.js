'use strict';

var grunt = require('grunt');
var _ = require('lodash');

var rootIDs = [
  "React",
  "ReactWithAddons"
];

// TODO: stop packaging these libraries
rootIDs = rootIDs.concat([
  "merge",
  "mergeInto",
  "copyProperties"
]);

var normal = {
  rootIDs: rootIDs,
  getConfig: function() {
    return {
      commonerConfig: grunt.config.data.pkg.commonerConfig,
      constants: {}
    };
  },
  sourceDir: "src",
  outputDir: "build/modules"
};


var test = {
  rootIDs: rootIDs.concat([
    "test/all.js",
    "**/__tests__/*.js"
  ]),
  getConfig: function() {
    return _.merge({}, normal.getConfig(), {
      mocking: true
    });
  },
  sourceDir: "src",
  outputDir: "build/modules"
};


module.exports = {
  normal: normal,
  test: test
};
