'use strict';

var grunt = require('grunt');
var path = require('path');

function run(done, coverage) {
  grunt.log.writeln('running jest');

  var args = [
    path.join('node_modules', 'jest-cli', 'bin', 'jest'),
    '--runInBand',
  ];
  if (coverage) {
    args.push('--coverage');
  }
  grunt.util.spawn({
    cmd: 'node',
    args: args,
    opts: {
      stdio: 'inherit',
      env: Object.assign({}, process.env, {
        NODE_ENV: 'test',
      }),
    },
  }, function(spawnErr, result, code) {
    if (spawnErr) {
      grunt.log.error('jest failed');
      grunt.log.error(spawnErr);
    } else {
      grunt.log.ok('jest passed');
    }
    grunt.log.writeln(result.stdout);

    done(code === 0);
  });
}

function runJestNormally() {
  var done = this.async();
  run(done);
}

function runJestWithCoverage() {
  var done = this.async();
  run(done, /* coverage */ true);
}

module.exports = {
  normal: runJestNormally,
  coverage: runJestWithCoverage,
};
