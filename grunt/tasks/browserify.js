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

  // create the bundle we'll work with
  var entries = grunt.file.expand(config.entries);

  // Extract other options
  var options = {
    entries: entries,
    debug: config.debug, // sourcemaps
    standalone: config.standalone, // global
    insertGlobalVars: {
      // We can remove this when we remove the few direct
      // process.env.NODE_ENV checks against "test".
      // The intention is to avoid embedding Browserify's `process` shim
      // because we don't really need it.
      // See https://github.com/facebook/react/pull/7245 for context.
      process: function() {
        return 'undefined';
      },
    },
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
