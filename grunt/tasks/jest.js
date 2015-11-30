// We run our own grunt task instead of using grunt-jest so that we can have
// more control. Specifically we want to set NODE_ENV and make sure stdio is
// inherited. We also run with --harmony directly so that we don't have to
// respawn immediately. We should be able to reduce some of this complexity
// when jest 0.5 is run on top of iojs.

'use strict';

var grunt = require('grunt');
var path = require('path');

module.exports = function() {
  var done = this.async();
  grunt.log.writeln('running jest (this may take a while)');
  grunt.util.spawn({
    cmd: 'node',
    args: ['--harmony', path.join('node_modules', 'jest-cli', 'bin', 'jest')],
    opts: {stdio: 'inherit', env: {NODE_ENV: 'test'}},
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('jest failed');
      grunt.log.error(err);
    } else {
      grunt.log.ok('jest passed');
    }
    grunt.log.writeln(result.stdout);

    done(code === 0);
  });
};
