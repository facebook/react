/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('graceful-fs');
var os = require('os');
var path = require('path');
var q = require('q');
var through = require('through');
var utils = require('./lib/utils');
var WorkerPool = require('node-worker-pool');
var Console = require('./Console');

var TEST_WORKER_PATH = require.resolve('./TestWorker');

var DEFAULT_OPTIONS = {

  /**
   * When true, runs all tests serially in the current process, rather than
   * creating a worker pool of child processes.
   *
   * This can be useful for debugging, or when the environment limits to a
   * single process.
   */
  runInBand: false,

  /**
   * The maximum number of workers to run tests concurrently with.
   *
   * It's probably good to keep this at something close to the number of cores
   * on the machine that's running the test.
   */
  maxWorkers: Math.max(os.cpus().length, 1),

  /**
   * The path to the executable node binary.
   *
   * This is used in the process of booting each of the workers.
   */
  nodePath: process.execPath,

  /**
   * The args to be passed to the node binary executable.
   *
   * this is used in the process of booting each of the workers.
   */
  nodeArgv: process.execArgv.filter(function(arg) {
    // Passing --debug off to child processes can screw with socket connections
    // of the parent process.
    return arg !== '--debug';
  })
};

var HIDDEN_FILE_RE = /\/\.[^\/]*$/;

/**
 * A class that takes a project's test config and provides various utilities for
 * executing its tests.
 *
 * @param config The jest configuration
 * @param options See DEFAULT_OPTIONS for descriptions on the various options
 *                and their defaults.
 */
function TestRunner(config, options) {
  this._config = config;
  this._configDeps = null;
  this._moduleLoaderResourceMap = null;
  this._testPathDirsRegExp = new RegExp(
    config.testPathDirs
      .map(function(dir) {
        return utils.escapeStrForRegex(dir);
      })
      .join('|')
  );

  this._nodeHasteTestRegExp = new RegExp(
    '/' + utils.escapeStrForRegex(config.testDirectoryName) + '/' +
    '.*\\.(' +
      config.testFileExtensions.map(function(ext) {
        return utils.escapeStrForRegex(ext);
      })
      .join('|') +
    ')$'
  );
  this._opts = Object.create(DEFAULT_OPTIONS);
  if (options) {
    for (var key in options) {
      this._opts[key] = options[key];
    }
  }
}

TestRunner.prototype._constructModuleLoader = function(environment, customCfg) {
  var config = customCfg || this._config;
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  return this._getModuleLoaderResourceMap().then(function(resourceMap) {
    return new ModuleLoader(config, environment, resourceMap);
  });
};

TestRunner.prototype._getModuleLoaderResourceMap = function() {
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  if (this._moduleLoaderResourceMap === null) {
    if (this._opts.useCachedModuleLoaderResourceMap) {
      this._moduleLoaderResourceMap =
        ModuleLoader.loadResourceMapFromCacheFile(this._config);
    } else {
      this._moduleLoaderResourceMap =
        ModuleLoader.loadResourceMap(this._config);
    }
  }
  return this._moduleLoaderResourceMap;
};

TestRunner.prototype._isTestFilePath = function(filePath) {
  filePath = utils.pathNormalize(filePath);
  var testPathIgnorePattern =
    this._config.testPathIgnorePatterns
    ? new RegExp(this._config.testPathIgnorePatterns.join('|'))
    : null;

  return (
    this._nodeHasteTestRegExp.test(filePath)
    && !HIDDEN_FILE_RE.test(filePath)
    && (!testPathIgnorePattern || !testPathIgnorePattern.test(filePath))
    && this._testPathDirsRegExp.test(filePath)
  );
};

TestRunner.prototype._loadConfigDependencies = function() {
  var config = this._config;
  if (this._configDeps === null) {
    this._configDeps = {
      ModuleLoader: require(config.moduleLoader),
      testEnvironment: require(config.testEnvironment),
      testRunner: require(config.testRunner).bind(null)
    };
  }
  return this._configDeps;
};

/**
 * Given a list of paths to modules or tests, find all tests that are related to
 * any of those paths. For a test to be considered "related" to a path, the test
 * must depend on that path (either directly, or indirectly through one of its
 * direct dependencies).
 *
 * @param {Array<String>} paths A list of path strings to find related tests for
 * @return {Stream<String>} Stream of absolute path strings
 */
TestRunner.prototype.streamTestPathsRelatedTo = function(paths) {
  var pathStream = through(
    function write(data) {
      if (data.isError) {
        this.emit('error', data);
        this.emit('end');
      } else {
        this.emit('data', data);
      }
    },
    function end() {
      this.emit('end');
    }
  );

  var testRunner = this;
  this._constructModuleLoader().done(function(moduleLoader) {
    var discoveredModules = {};

    // If a path to a test file is given, make sure we consider that test as
    // related to itself...
    //
    // (If any of the supplied paths aren't tests, it's ok because we filter
    //  non-tests out at the end)
    paths.forEach(function(path) {
      discoveredModules[path] = true;
      if (testRunner._isTestFilePath(path) && fs.existsSync(path)) {
        pathStream.write(path);
      }
    });

    var modulesToSearch = [].concat(paths);
    while (modulesToSearch.length > 0) {
      var modulePath = modulesToSearch.shift();
      var depPaths = moduleLoader.getDependentsFromPath(modulePath);

      /* jshint loopfunc:true */
      depPaths.forEach(function(depPath) {
        if (!discoveredModules.hasOwnProperty(depPath)) {
          discoveredModules[depPath] = true;
          modulesToSearch.push(depPath);
          if (testRunner._isTestFilePath(depPath) && fs.existsSync(depPath)) {
            pathStream.write(depPath);
          }
        }
      });
    }

    pathStream.end();
  });

  return pathStream;
};


/**
 * Like `streamTestPathsRelatedTo`, but returns a Promise resolving an array of
 * all paths.
 *
 * @param {Array<String>} paths A list of path strings to find related tests for
 * @return {Promise<Array<String>>} Promise of array of absolute path strings
 */
TestRunner.prototype.promiseTestPathsRelatedTo = function(paths) {
  return _pathStreamToPromise(this.streamTestPathsRelatedTo(paths));
};

/**
 * Given a path pattern, find all absolute paths for all tests that match the
 * pattern.
 *
 * @param {RegExp} pathPattern
 * @return {Stream<String>} Stream of absolute path strings
 */
TestRunner.prototype.streamTestPathsMatching = function(pathPattern) {
  var pathStream = through(
    function write(data) {
      if (data.isError) {
        this.emit('error', data);
        this.emit('end');
      } else {
        this.emit('data', data);
      }
    },
    function end() {
      this.emit('end');
    }
  );

  this._getModuleLoaderResourceMap().then(function(resourceMap) {
    var resourcePathMap = resourceMap.resourcePathMap;
    for (var i in resourcePathMap) {
      // Sometimes the loader finds a path with no resource. This typically
      // happens if a file is recently deleted.
      if (!resourcePathMap[i]) {
        continue;
      }

      var pathStr = resourcePathMap[i].path;
      if (
        this._isTestFilePath(pathStr) &&
        pathPattern.test(pathStr)
      ) {
        pathStream.write(pathStr);
      }
    }
    pathStream.end();
  }.bind(this));


  return pathStream;
};

/**
 * Like `streamTestPathsMatching`, but returns a Promise resolving an array of
 * all paths
 *
 * @param {RegExp} pathPattern
 * @return {Promise<Array<String>>} Promise of array of absolute path strings
 */
TestRunner.prototype.promiseTestPathsMatching = function(pathPattern) {
  return _pathStreamToPromise(this.streamTestPathsMatching(pathPattern));
};

/**
 * For use by external users of TestRunner as a means of optimization.
 *
 * Imagine the following scenario executing in a child worker process:
 *
 * var runner = new TestRunner(config, {
 *   moduleLoaderResourceMap: serializedResourceMap
 * });
 * someOtherAyncProcess.then(function() {
 *   runner.runTestsParallel();
 * });
 *
 * Here we wouldn't start deserializing the resource map (passed to us from the
 * parent) until runner.runTestsParallel() is called. At the time of this
 * writing, resource map deserialization is slow and a bottleneck on running the
 * first test in a child.
 *
 * So this API gives scenarios such as the one above an optimization path to
 * potentially start deserializing the resource map while we wait on the
 * someOtherAsyncProcess to resolve (rather that doing it after it's resolved).
 */
TestRunner.prototype.preloadResourceMap = function() {
  this._getModuleLoaderResourceMap().done();
};

TestRunner.prototype.preloadConfigDependencies = function() {
  this._loadConfigDependencies();
};

/**
 * Run the given single test file path.
 * This just contains logic for running a single test given it's file path.
 *
 * @param {String} testFilePath
 * @return {Promise<Object>} Results of the test
 */
TestRunner.prototype.runTest = function(testFilePath) {
  // Using Object.create() lets us adjust the config object locally without
  // worrying about the external consequences of changing the config object for
  // needs that are local to this particular function call
  var config = Object.create(this._config);
  var configDeps = this._loadConfigDependencies();

  var env = new configDeps.testEnvironment(config);
  var testRunner = configDeps.testRunner;

  // Capture and serialize console.{log|warning|error}s so they can be passed
  // around (such as through some channel back to a parent process)
  var consoleMessages = [];
  env.global.console = new Console(consoleMessages);

  // Pass the testFilePath into the runner, so it can be used to e.g.
  // configure test reporter output.
  env.testFilePath = testFilePath;

  return this._constructModuleLoader(env, config).then(function(moduleLoader) {
    // This is a kind of janky way to ensure that we only collect coverage
    // information on modules that are immediate dependencies of the test file.
    //
    // Collecting coverage info on more than that is often not useful as
    // *usually*, when one is looking for coverage info, one is only looking
    // for coverage info on the files under test. Since a test file is just a
    // regular old module that can depend on whatever other modules it likes,
    // it's usually pretty hard to tell which of those dependencies is/are the
    // "module(s)" under test.
    //
    // I'm not super happy with having to inject stuff into the config object
    // mid-stream here, but it gets the job done.
    if (config.collectCoverage && !config.collectCoverageOnlyFrom) {
      config.collectCoverageOnlyFrom = {};
      moduleLoader.getDependenciesFromPath(testFilePath)
        .filter(function(depPath) {
          // Skip over built-in and node modules
          return /^\//.test(depPath);
        }).forEach(function(depPath) {
          config.collectCoverageOnlyFrom[depPath] = true;
        });
    }

    if (config.setupEnvScriptFile) {
      utils.runContentWithLocalBindings(
        env.runSourceText.bind(env),
        utils.readAndPreprocessFileContent(config.setupEnvScriptFile, config),
        config.setupEnvScriptFile,
        {
          __dirname: path.dirname(config.setupEnvScriptFile),
          __filename: config.setupEnvScriptFile,
          global: env.global,
          require: moduleLoader.constructBoundRequire(
            config.setupEnvScriptFile
          ),
          jest: moduleLoader.getJestRuntime(config.setupEnvScriptFile)
        }
      );
    }

    var testExecStats = {start: Date.now()};
    return testRunner(config, env, moduleLoader, testFilePath)
      .then(function(results) {
        testExecStats.end = Date.now();

        results.logMessages = consoleMessages;
        results.perfStats = testExecStats;
        results.testFilePath = testFilePath;
        results.coverage =
          config.collectCoverage
          ? moduleLoader.getAllCoverageInfo()
          : {};

        return results;
      });
  }).finally(function() {
    env.dispose();
  });
};

/**
 * Run all given test paths.
 *
 * @param {Array<String>} testPaths Array of paths to test files
 * @param {Object} reporter Collection of callbacks called on test events
 * @return {Promise<Object>} Fulfilled with information about test run:
 *   success: true if all tests passed
 *   runTime: elapsed time in seconds to run all tests
 *   numTotalTests: total number of tests considered
 *   numPassedTests: number of tests run and passed
 *   numFailedTests: number of tests run and failed
 *   testResults: the jest result info for all tests run
 */
TestRunner.prototype.runTests = function(testPaths, reporter) {
  var config = this._config;
  if (!reporter) {
    var TestReporter = require(config.testReporter);
    reporter = new TestReporter();
  }

  var aggregatedResults = {
    success: null,
    startTime: null,
    numTotalTests: testPaths.length,
    numPassedTests: 0,
    numFailedTests: 0,
    testResults: [],
    postSuiteHeaders: []
  };

  reporter.onRunStart && reporter.onRunStart(config, aggregatedResults);

  var onTestResult = function (testPath, testResult) {
    aggregatedResults.testResults.push(testResult);
    if (testResult.numFailingTests > 0) {
      aggregatedResults.numFailedTests++;
    } else {
      aggregatedResults.numPassedTests++;
    }
    reporter.onTestResult && reporter.onTestResult(
      config,
      testResult,
      aggregatedResults
    );
  };

  var onRunFailure = function (testPath, err) {
    aggregatedResults.numFailedTests++;
    reporter.onTestResult && reporter.onTestResult(config, {
      testFilePath: testPath,
      testExecError: err,
      suites: {},
      tests: {},
      logMessages: []
    }, aggregatedResults);
  };

  aggregatedResults.startTime = Date.now();
  var testRun = this._createTestRun(testPaths, onTestResult, onRunFailure);

  return testRun.then(function() {
    aggregatedResults.success = aggregatedResults.numFailedTests === 0;
    reporter.onRunComplete && reporter.onRunComplete(config, aggregatedResults);
    return aggregatedResults;
  });
};

TestRunner.prototype._createTestRun = function(
  testPaths, onTestResult, onRunFailure
) {
  if (this._opts.runInBand || testPaths.length <= 1) {
    return this._createInBandTestRun(testPaths, onTestResult, onRunFailure);
  } else {
    return this._createParallelTestRun(testPaths, onTestResult, onRunFailure);
  }
};

TestRunner.prototype._createInBandTestRun = function(
  testPaths, onTestResult, onRunFailure
) {
  var testSequence = q();
  testPaths.forEach(function(testPath) {
    testSequence = testSequence.then(this.runTest.bind(this, testPath))
      .then(function(testResult) {
        onTestResult(testPath, testResult);
      })
      .catch(function(err) {
        onRunFailure(testPath, err);
      });
  }, this);
  return testSequence;
};

TestRunner.prototype._createParallelTestRun = function(
  testPaths, onTestResult, onRunFailure
) {
  var workerPool = new WorkerPool(
    this._opts.maxWorkers,
    this._opts.nodePath,
    this._opts.nodeArgv.concat([
      '--harmony',
      TEST_WORKER_PATH,
      '--config=' + JSON.stringify(this._config)
    ])
  );

  return this._getModuleLoaderResourceMap()
    .then(function() {
      return q.all(testPaths.map(function(testPath) {
        return workerPool.sendMessage({testFilePath: testPath})
          .then(function(testResult) {
            onTestResult(testPath, testResult);
          })
          .catch(function(err) {
            onRunFailure(testPath, err);

            // Jest uses regular worker messages to initialize workers, so
            // there's no way for node-worker-pool to understand how to
            // recover/re-initialize a child worker that needs to be restarted.
            // (node-worker-pool can't distinguish between initialization
            // messages and ephemeral "normal" messages in order to replay the
            // initialization message upon booting the new, replacement worker
            // process).
            //
            // This is mostly a limitation of node-worker-pool's initialization
            // features, and ideally it would be possible to recover from a
            // test that causes a worker process to exit unexpectedly. However,
            // for now Jest will just fail hard if any child process exits
            // unexpectedly.
            //
            // This will likely bite me in the ass as an unbreak now if we hit
            // this issue again -- but I guess that's a faster failure than
            // having Jest just hang forever without any indication as to why.
            if (err.message
                && /Worker process exited before /.test(err.message)) {
              console.error(
                'A worker process has quit unexpectedly! This is bad news, ' +
                'shutting down now!'
              );
              process.exit(1);
            }
          });
      }));
    })
    .then(function() {
      return workerPool.destroy();
    });
};

function _pathStreamToPromise(stream) {
  var defer = q.defer();
  var paths = [];
  stream.on('data', function(path) {
    paths.push(path);
  });
  stream.on('error', function(err) {
    defer.reject(err);
  });
  stream.on('end', function() {
    defer.resolve(paths);
  });
  return defer.promise;
}


module.exports = TestRunner;
