/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var q = require('q');
var TestRunner = require('./TestRunner');
var utils = require('./lib/utils');

var _jestVersion = null;
function getVersion() {
  if (_jestVersion === null) {
    var pkgJsonPath = path.resolve(__dirname, '..', 'package.json');
    _jestVersion = require(pkgJsonPath).version;
  }
  return _jestVersion;
}

function _findChangedFiles(dirPath) {
  var deferred = q.defer();

  var args =
    ['diff', '--name-only', '--diff-filter=ACMR'];
  var child = childProcess.spawn('git', args, {cwd: dirPath});

  var stdout = '';
  child.stdout.on('data', function(data) {
    stdout += data;
  });

  var stderr = '';
  child.stderr.on('data', function(data) {
    stderr += data;
  });

  child.on('close', function(code) {
    if (code === 0) {
      stdout = stdout.trim();
      if (stdout === '') {
        deferred.resolve([]);
      } else {
        deferred.resolve(stdout.split('\n').map(function(changedPath) {
          return path.resolve(dirPath, changedPath);
        }));
      }
    } else {
      deferred.reject(code + ': ' + stderr);
    }
  });

  return deferred.promise;
}

function _verifyIsGitRepository(dirPath) {
  var deferred = q.defer();

  childProcess.spawn('git', ['rev-parse', '--git-dir'], {cwd: dirPath})
    .on('close', function(code) {
      var isGitRepo = code === 0;
      deferred.resolve(isGitRepo);
    });

  return deferred.promise;
}

function _testRunnerOptions(argv) {
  var options = {};
  if (argv.runInBand) {
    options.runInBand = argv.runInBand;
  }
  if (argv.maxWorkers) {
    options.maxWorkers = argv.maxWorkers;
  }
  return options;
}

function _promiseConfig(argv, packageRoot) {
  return _promiseRawConfig(argv, packageRoot).then(function (config) {
    if (argv.coverage) {
      config.collectCoverage = true;
    }

    if (argv.testEnvData) {
      config.testEnvData = argv.testEnvData;
    }

    config.noHighlight = argv.noHighlight || !process.stdout.isTTY;

    if (argv.verbose) {
      config.verbose = argv.verbose;
    }

    if (argv.bail) {
      config.bail = argv.bail;
    }

    return config;
  });
}

function _promiseRawConfig(argv, packageRoot) {
  if (typeof argv.config === 'string') {
    return utils.loadConfigFromFile(argv.config);
  }

  if (typeof argv.config === 'object') {
    return q(utils.normalizeConfig(argv.config));
  }

  var pkgJsonPath = path.join(packageRoot, 'package.json');
  var pkgJson = fs.existsSync(pkgJsonPath) ? require(pkgJsonPath) : {};

  // Look to see if there is a package.json file with a jest config in it
  if (pkgJson.jest) {
    if (!pkgJson.jest.hasOwnProperty('rootDir')) {
      pkgJson.jest.rootDir = packageRoot;
    } else {
      pkgJson.jest.rootDir = path.resolve(packageRoot, pkgJson.jest.rootDir);
    }
    var config = utils.normalizeConfig(pkgJson.jest);
    config.name = pkgJson.name;
    return q(config);
  }

  // Sane default config
  return q(utils.normalizeConfig({
    name: packageRoot.replace(/[/\\]/g, '_'),
    rootDir: packageRoot,
    testPathDirs: [packageRoot],
    testPathIgnorePatterns: ['/node_modules/.+']
  }));
}

function _promiseOnlyChangedTestPaths(testRunner, config) {
  var testPathDirsAreGit = config.testPathDirs.map(_verifyIsGitRepository);
  return q.all(testPathDirsAreGit)
    .then(function(results) {
      if (!results.every(function(result) { return result; })) {
        throw (
          'It appears that one of your testPathDirs does not exist ' +
          'with in a git repository. Currently --onlyChanged only works ' +
          'with git projects.\n'
        );
      }
      return q.all(config.testPathDirs.map(_findChangedFiles));
    })
    .then(function(changedPathSets) {
      // Collapse changed files from each of the testPathDirs into a single list
      // of changed file paths
      var changedPaths = [];
      changedPathSets.forEach(function(pathSet) {
        changedPaths = changedPaths.concat(pathSet);
      });
      return testRunner.promiseTestPathsRelatedTo(changedPaths);
    });
}

function _promisePatternMatchingTestPaths(argv, testRunner) {
  var pattern = argv.testPathPattern ||
    ( (argv._ && argv._.length) ? argv._.join('|') : '.*' );

  return testRunner.promiseTestPathsMatching(new RegExp(pattern));
}

function runCLI(argv, packageRoot, onComplete) {
  argv = argv || {};

  if (argv.version) {
    console.log('v' + getVersion());
    onComplete && onComplete(true);
    return;
  }

  _promiseConfig(argv, packageRoot).then(function(config) {
    var testRunner = new TestRunner(config, _testRunnerOptions(argv));
    var testPaths = argv.onlyChanged ?
      _promiseOnlyChangedTestPaths(testRunner, config) :
      _promisePatternMatchingTestPaths(argv, testRunner);
    return testPaths.then(function (testPaths) {
      return testRunner.runTests(testPaths);
    });
  }).then(function (runResults) {
    onComplete && onComplete(runResults.success);
  }).catch(function (error) {
    console.error('Failed with unexpected error.');
    process.nextTick(function () {
      throw error;
    });
  });
}

exports.TestRunner = TestRunner;
exports.getVersion = getVersion;
exports.runCLI = runCLI;
