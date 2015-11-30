'use strict';

var grunt = require('grunt');

var extension = process.platform === 'win32' ? '.cmd': '';

module.exports = function() {
  var done = this.async();
  grunt.util.spawn({
    cmd: 'node_modules/.bin/eslint' + extension,
    args: ['.'],
    opts: {stdio: 'inherit'}, // allows colors to passthrough
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('Lint failed');
    } else {
      grunt.log.ok('Lint passed');
    }

    done(code === 0);
  });
};
