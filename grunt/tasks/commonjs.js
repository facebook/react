'use strict';

var cjs = require('pure-cjs');
var grunt = require('grunt');

module.exports = function() {
  var config = this.options({
    transforms: [],
    after: []
  });

  // This task is async...
  var done = this.async();

  // Extract options
  var options = {
    input: this.files[0].src[0],
    output: this.files[0].dest,
    map: config.debug, // sourcemaps
    exports: config.standalone, // global
    transform: config.transforms,
    dryRun: true // we will write to disk ourselves
  };

  // Actually bundle it up
  var _this = this;

  cjs.transform(options).then(function(result) {
    grunt.file.write(_this.files[0].dest, config.after.reduce(function(src, fn) {
      return fn.call(_this, src);
    }, result.code));

    done();
  }, function(err) {
    grunt.log.error(err);
    done();
  });
};
