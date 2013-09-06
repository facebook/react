'use strict';

var rootIDs = [
  "React",
  "ReactTransitionGroup"
];

var debug = {
  rootIDs: rootIDs,
  configFile: "grunt/config/jsx/debug.json",
  sourceDir: "src",
  outputDir: "build/modules"
};

var jasmine = {
  rootIDs: [
    "all"
  ],
  configFile: debug.configFile,
  sourceDir: "vendor/jasmine",
  outputDir: "build/jasmine"
};

var test = {
  rootIDs: rootIDs.concat([
    "test/all.js",
    "**/__tests__/*.js"
  ]),
  configFile: "grunt/config/jsx/test.json",
  sourceDir: "src",
  outputDir: "build/modules"
};

var release = {
  rootIDs: rootIDs,
  configFile: "grunt/config/jsx/release.json",
  sourceDir: "src",
  outputDir: "build/modules"
};

module.exports = {
  debug: debug,
  jasmine: jasmine,
  test: test,
  release: release
};
