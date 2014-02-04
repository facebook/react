'use strict';

var cjs = require('pure-cjs');
var grunt = require('grunt');

module.exports = function() {
  var config = this.data;

  // This task is async...
  var done = this.async();

  // More/better assertions
  // grunt.config.requires('outfile');
  // grunt.config.requires('entries');
  config.transforms = config.transforms || [];
  config.after = config.after || [];
  if (typeof config.after === 'function') {
    config.after = [config.after];
  }

  // Extract options
  var options = {
    input: config.entries[0],
    output: config.outfile,
    map: config.debug, // sourcemaps
    exports: config.standalone, // global
    transform: config.transforms,
    dryRun: true // we will write to disk ourselves
  };

  // Actually bundle it up
  var _this = this;
  cjs.transform(options).then(function(result) {
    grunt.file.write(config.outfile, config.after.reduce(function(src, fn) {
      return fn.call(_this, src);
    }, result.code));

    done();
  }, function(err) {
    grunt.log.error(err);
    done();
  });
};
