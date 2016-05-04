'use strict';

var grunt = require('grunt');

var extension = process.platform === 'win32' ? '.cmd': '';

module.exports = function() {
  var done = this.async();
  grunt.util.spawn({
    cmd: 'node_modules/.bin/flow' + extension,
    args: ['check', '.'],
    opts: {stdio: 'inherit'},
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('Flow failed');
    } else {
      grunt.log.ok('Flow passed');
    }

    done(code === 0);
  });
};
