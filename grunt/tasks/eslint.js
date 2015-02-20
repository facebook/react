'use strict';

var grunt = require('grunt');

module.exports = function() {
  var done = this.async();
  grunt.util.spawn({
    cmd: 'node_modules/.bin/eslint',
    args: [
      'src/',
      'Gruntfile.js',
      'grunt/',
      'main.js',
      'perf/',
      'test/',
      'vendor/fbtransform'
    ]
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('Lint failed');
    } else {
      grunt.log.ok('Lint passed (but may contain warnings)');
    }
    if (result.stdout.length) {
      grunt.log.writeln(result.stdout);
    }

    done(code === 0);
  });
};
