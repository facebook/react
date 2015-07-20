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
  config.transforms = config.transforms || [];
  config.globalTransforms = config.globalTransforms || [];
  config.plugins = config.plugins || [];
  config.after = config.after || [];
  config.paths = config.paths || [];

  // create the bundle we'll work with
  var entries = grunt.file.expand(config.entries);
  var paths = grunt.file.expand(config.paths);

  // Extract other options
  var options = {
    entries: entries,
    debug: config.debug, // sourcemaps
    standalone: config.standalone, // global
    paths: paths,
  };

  var bundle = browserify(options);

  config.transforms.forEach(function(transform) {
    bundle.transform({}, transform);
  });

  config.globalTransforms.forEach(function(transform) {
    bundle.transform({global: true}, transform);
  });

  config.plugins.forEach(bundle.plugin, bundle);

  // Actually bundle it up
  var _this = this;
  bundle.bundle(function(err, buf) {
    if (err) {
      grunt.log.error(err);
      return done();
    }

    var src = buf.toString();

    config.after.forEach(function(fn) {
      src = fn.call(_this, src);
    });

    grunt.file.write(config.outfile, src);
    done();
  });
};
