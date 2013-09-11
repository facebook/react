'use strict';

var grunt = require('grunt');

var rootIDs = [
  "React",
  "ReactTransitionGroup"
];

var getDebugConfig = function() {
  return {
    "debug": true,
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

var jasmine = {
  rootIDs: [
    "all"
  ],
  getConfig: getDebugConfig,
  sourceDir: "vendor/jasmine",
  outputDir: "build/jasmine"
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
  jasmine: jasmine,
  test: test,
  release: release
};
