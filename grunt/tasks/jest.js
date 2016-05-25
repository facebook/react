'use strict';

var async = require('async');
var fs = require('fs');
var glob = require('glob');
var grunt = require('grunt');
var path = require('path');

var rootPath = path.resolve('.');
var buildPath = path.join(rootPath, 'build');
var tempConfigPath = path.join(buildPath, 'jest-config.json');

var config = require(path.join(rootPath, 'package.json')).jest;

var collectCoverageOnlyFrom = {
  'src/**/*.js': {
    ignore: [
      'src/**/__tests__/*.js',
      'src/shared/vendor/third_party/*.js',
      'src/test/*.js',
    ],
  },
};

function getCollectCoverageOnlyFrom(callback) {
  var patterns = Object.keys(collectCoverageOnlyFrom);
  var result = {};

  async.each(patterns, function(pattern) {
    var options = Object.assign({ nodir: true }, collectCoverageOnlyFrom[pattern]);
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
    callback(err, Object.assign({}, config, {
      rootDir: rootDir,
      name: 'react',
      collectCoverage: true,
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
      grunt.file.mkdir(buildPath);
      fs.writeFile(tempConfigPath, JSON.stringify(data, null, '  '), 'utf8', callback);
    }
  });
}

function run(done, configPath) {
  grunt.log.writeln('running jest');

  var args = [
    path.join('node_modules', 'jest', 'bin', 'jest'),
    '--runInBand',
    '--no-watchman',
  ];
  if (configPath) {
    args.push('--config', configPath);
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
