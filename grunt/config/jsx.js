'use strict';

var grunt = require('grunt');

var rootIDs = [
  "React",
  "ReactWithAddons"
];

var getDebugConfig = function() {
  return {
    "commonerConfig": grunt.config.data.pkg.commonerConfig,
    "constants": {
      "__VERSION__": grunt.config.data.pkg.version
    }
  };
};

var debug = {
  rootIDs: rootIDs,
  getConfig: getDebugConfig,
  sourceDir: "src",
  outputDir: "build/modules"
};

var test = {
  rootIDs: rootIDs.concat([
    "test/all.js",
    "**/__tests__/*.js"
  ]),
  getConfig: function() {
    return {
      "mocking": true,
      "commonerConfig": grunt.config.data.pkg.commonerConfig,
      "constants": {
        "__VERSION__": grunt.config.data.pkg.version
      }
    };
  },
  sourceDir: "src",
  outputDir: "build/modules"
};


var release = {
  rootIDs: rootIDs,
  getConfig: function() {
    return {
      "commonerConfig": grunt.config.data.pkg.commonerConfig,
      "constants": {
        "__VERSION__": grunt.config.data.pkg.version
      }
    };
  },
  sourceDir: "src",
  outputDir: "build/modules"
};


module.exports = {
  debug: debug,
  test: test,
  release: release
};
