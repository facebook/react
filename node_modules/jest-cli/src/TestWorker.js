/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var optimist = require('optimist');
//var q = require('q');
var TestRunner = require('./TestRunner');
var workerUtils = require('node-worker-pool/nodeWorkerUtils');

if (require.main === module) {
  try {
    process.on('uncaughtException', workerUtils.respondWithError);

    var argv = optimist.demand(['config']).argv;
    var config = JSON.parse(argv.config);

    var testRunner = null;
    /* jshint -W082:true */
    function onMessage(message) {
      if (testRunner === null) {
        testRunner = new TestRunner(config, {
          useCachedModuleLoaderResourceMap: true,
        });

        // Start require()ing config dependencies now.
        //
        // Config dependencies are entries in the config that are require()d (in
        // order to be pluggable) such as 'moduleLoader' or
        // 'testEnvironment'.
        testRunner.preloadConfigDependencies();

        // Start deserializing the resource map to get a potential head-start on
        // that work before the first "run-test" message comes in.
        //
        // This is just a perf optimization -- and it is only an optimization
        // some of the time (when the there is any significant idle time between
        // this first initialization message and the first "run-rest" message).
        //
        // It is also only an optimization so long as deserialization of the
        // resource map is a bottleneck (which is the case at the time of this
        // writing).
        testRunner.preloadResourceMap();
      }

      return testRunner.runTest(message.testFilePath)
        .catch(function(err) {
          throw (err.stack || err.message || err);
        });
    }

    workerUtils.startWorker(null, onMessage);
  } catch (e) {
    workerUtils.respondWithError(e);
  }
}
