'use strict';

var grunt = require('grunt');

module.exports = function() {
  var wrup = require('wrapup')();
  var config = this.data;

  // This task is async...
  var done = this.async();

  config.requires = config.requires || {};

  Object.keys(config.requires).forEach(function(id) {
    wrup = wrup.require(id, config.requires[id]);
  });

  wrup.options({
    sourcemap: config.debug && config.outfile.replace(/\.js$/i, ".map")
  }).up(function(err, src) {
    if (err) {
      grunt.log.error(err);
      done();
    }

    // TODO: post processing hooks, scope?
    if (config.after) {
      src = config.after.call(this, src);
    }

    grunt.file.write(config.outfile, src);
    done();
  });
};
