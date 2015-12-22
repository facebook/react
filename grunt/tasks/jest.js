// We run our own grunt task instead of using grunt-jest so that we can have
// more control. Specifically we want to set NODE_ENV and make sure stdio is
// inherited. We also run with --harmony directly so that we don't have to
// respawn immediately. We should be able to reduce some of this complexity
// when jest 0.5 is run on top of iojs.

'use strict';

var assign = require('object-assign');
var async = require('async');
var fs = require('fs');
var glob = require('glob');
var grunt = require('grunt');
var path = require('path');

var rootPath = path.resolve('.');
var buildPath = path.join(rootPath, 'build');
var tempConfigPath = path.join(buildPath, 'jest-config.json');

var config = require(path.join(rootPath, 'package.json')).jest;

function getCollectCoverageOnlyFrom(callback) {
  var coverageFrom = config.collectCoverageOnlyFrom;
  var patterns = Object.keys((config.collectCoverage && coverageFrom) || {});
  var result = {};

  async.each(patterns, function(pattern) {
    var options = assign({ nodir: true }, coverageFrom[pattern]);
    glob(pattern, options, function(err, files) {
      (files || []).reduce(function(object, key) {
        object[key] = true;
        return object;
      }, result);

      callback(err);
    });
  }, function(err) {
    callback(err, result);
  });
}

function getJestConfig(callback) {
  var rootDir = path.resolve(buildPath, path.resolve(config.rootDir));
  getCollectCoverageOnlyFrom(function(err, data) {
    callback(err, assign({}, config, {
      rootDir: rootDir,
      collectCoverageOnlyFrom: data,
    }));
  });
}

function onError(err) {
  grunt.log.error('jest failed');
  grunt.log.error(err);
}

function writeTempConfig(callback) {
  getJestConfig(function(err, data) {
    if (err) {
      callback(err);
    } else {
      fs.writeFile(tempConfigPath, JSON.stringify(data, null, '  '), 'utf8', callback);
    }
  });
}

function run(done, configPath) {
  grunt.log.writeln('running jest (this may take a while)');

  var args = ['--harmony', path.join('node_modules', 'jest-cli', 'bin', 'jest')];
  if (configPath) {
    args.push('--config', configPath);
  }
  grunt.util.spawn({
    cmd: 'node',
    args: args,
    opts: { stdio: 'inherit', env: { NODE_ENV: 'test' } },
  }, function(spawnErr, result, code) {
    if (spawnErr) {
      onError(spawnErr);
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

  writeTempConfig(function(writeErr) {
    if (writeErr) {
      onError(writeErr);
      return;
    }

    run(done, tempConfigPath);
  });
}

module.exports = {
  normal: runJestNormally,
  coverage: runJestWithCoverage,
};
