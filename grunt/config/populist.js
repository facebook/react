'use strict';

var jasmine = {
  rootDirectory: "build/jasmine",
  // This syntax means to require and expose the "jasmine" module
  // (build/jasmine/jasmine.js) as global.jasmine, and to require the
  // "all" module (build/jasmine/all.js) but not expose it globally.
  args: ["jasmine:jasmine", "all:"],
  outfile: "./build/jasmine.js"
};

var test = {
  rootDirectory: "build/modules",
  args: ["test/all:"],
  requires: [
    "**/__tests__/*-test.js"
  ],
  outfile: './build/react-test.js'
};

module.exports = {
  jasmine: jasmine,
  test: test
};
