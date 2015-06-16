'use strict';

var grunt = require('grunt');

module.exports = function() {
  var done = this.async();
  grunt.util.spawn({
    cmd: 'node_modules/eslint-tester/node_modules/mocha/bin/mocha',
    args: ['eslint-rules/__tests__'],
    opts: {stdio: 'inherit'}, // allows colors to passthrough
  }, function(err, result, code) {
    if (err) {
      grunt.log.error('Custom linter rules are broken');
    } else {
      grunt.log.ok('Custom linter rules are okay');
    }

    done(code === 0);
  });
};
