'use strict';

var rootIDs = [
  "React"
];

var debug = {
  rootIDs: rootIDs,
  configFile: "grunt/config/jsx/debug.json"
};

var test = {
  rootIDs: rootIDs.concat([
    "test/all.js",
    "**/__tests__/*.js"
  ]),
  configFile: debug.configFile
};

var release = {
  rootIDs: rootIDs,
  configFile: "grunt/config/jsx/release.json"
};

module.exports = {
  debug: debug,
  test: test,
  release: release
};
