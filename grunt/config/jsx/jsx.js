'use strict';

var grunt = require('grunt');

var rootIDs = [
  "React",
  "ReactWithAddons"
];

var getDebugConfig = function() {
  return {
    "debug": true,
    "commonerConfig": grunt.config.data.pkg.commonerConfig,
    "constants": {
      "__VERSION__": grunt.config.data.pkg.version,
      "__DEV__": true
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
      "debug": true,
      "mocking": true,
      "commonerConfig": grunt.config.data.pkg.commonerConfig,
      "constants": {
        "__VERSION__": grunt.config.data.pkg.version,
        "__DEV__": true
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
      "debug": false,
      "commonerConfig": grunt.config.data.pkg.commonerConfig,
      "constants": {
        "__VERSION__": grunt.config.data.pkg.version,
        "__DEV__": false
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
