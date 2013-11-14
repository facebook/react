'use strict';

var grunt = require('grunt');

module.exports = function(){
  var onReadyCallback = this.async();

  var phantomjs = require("phantomjs").path;
  var child_process = require('child_process');
  var config = this.data || {};

  var args = ["--webdriver=" + (config.port || 9515)];
  grunt.verbose.writeln('phantomjs START path:%s args:%s', phantomjs, args);

  var child = child_process.spawn(phantomjs, args);
  process.on('exit', function() {
    child.kill();
  });

  child.on('error', function(error) {
    grunt.verbose.writeln('phantomjs ERROR');
    grunt.fatal(error);
  });
  child.on('exit', function(code) {
    grunt.verbose.writeln('phantomjs END');
    if (code) {
      grunt.fatal('phantomjs FAIL');
    }
  });

  function verboseWrite(chunk) {
    if (onReadyCallback && chunk.toString().indexOf('running on port') != -1) {
      grunt.verbose.writeln('phantomjs STARTED');
      onReadyCallback();
      onReadyCallback = null;
    }
    grunt.verbose.write(chunk);
  }
  child.stdout.on('data', verboseWrite);
  child.stderr.on('data', verboseWrite);
};
