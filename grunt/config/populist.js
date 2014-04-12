'use strict';

module.exports = function(grunt) {
  var jasmine = {
    rootDirectory: "build/jasmine",
    // This syntax means to require and expose the "jasmine" module
    // (build/jasmine/jasmine.js) as global.jasmine, and to require the
    // "all" module (build/jasmine/all.js) but not expose it globally.
    args: ["jasmine:jasmine", "all:"],
    outfile: "./build/jasmine.js"
  };

  var filterExpr = grunt.option('filter');

  if (filterExpr) {
    filterExpr = '**/__tests__/' + filterExpr + '-test.js';
  } else {
    filterExpr = '**/__tests__/*-test.js';
  }

  var test = {
    rootDirectory: "build/modules",
    args: ["test/all:harness"],
    requires: [filterExpr],
    outfile: './build/react-test.js'
  };

  return {
    jasmine: jasmine,
    test: test
  };
};
