'use strict';

var grunt = require('grunt');

module.exports = function() {
  var config = this.data;
  var done = this.async();

  // create the bundle we'll work with
  var args = config.args;

  // Make sure the things that need to be exposed are.
  var requires = config.requires || [];
  grunt.file.expand({
    nonull: true, // Keep IDs that don't expand to anything.
    cwd: config.rootDirectory
  }, requires).forEach(function(name) {
    args.push(name.replace(/\.js$/i, ""));
  });

  require("populist").buildP({
    rootDirectory: config.rootDirectory,
    args: args
  }).then(function(output) {
    grunt.file.write(config.outfile, output);
    done();
  });
};
