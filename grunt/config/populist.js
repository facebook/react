'use strict';

var test = {
  args: ["test/all:"],
  requires: [
    "**/__tests__/*-test.js"
  ],
  outfile: './build/react-test.js'
};

module.exports = {
  test: test
};
