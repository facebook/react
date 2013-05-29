'use strict';

var browserify = require('browserify');
var grunt = require('grunt');

module.exports = function() {
  var config = this.data;

  // This task is async...
  var done = this.async();

  // More/better assertions
  // grunt.config.requires('outfile');
  // grunt.config.requires('entries');
  config.requires = config.requires || {};
  config.transforms = config.transforms || [];
  config.after = config.after || [];
  if (typeof config.after === 'function') {
    config.after = [config.after];
  }

  // create the bundle we'll work with
  var entries = grunt.file.expand(config.entries);
  var bundle = browserify(entries);

  // Make sure the things that need to be exposed are.
  // TODO: support a blob pattern maybe?
  for (var name in config.requires) {
    bundle.require(config.requires[name], { expose: name });
  }

  // Extract other options
  var options = {
    debug: config.debug, // sourcemaps
    standalone: config.standalone // global
  };

  // TODO: make sure this works, test with this too
  config.transforms.forEach(bundle.transform, this);

  // Actually bundle it up
  var _this = this;
  bundle.bundle(options, function(err, src) {
    if (err) {
      grunt.log.error(err);
      done();
    }

    config.after.forEach(function(fn) {
      src = fn.call(_this, src);
    });

    grunt.file.write(config.outfile, src);
    done();
  });
};
