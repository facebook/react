'use strict';

var grunt = require('grunt');

module.exports = function() {
  var done = this.async();
  grunt.log.writeln('running jest (this may take a while)');
  grunt.util.spawn({
    cmd: 'node',
    args: ['--harmony', 'node_modules/jest-cli/bin/jest', '-i'],
    opts: {stdio: 'inherit'},
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('jest failed');
    } else {
      grunt.log.ok('jest passed');
    }
    grunt.log.writeln(result.stdout);

    done(code === 0);
  });
};
