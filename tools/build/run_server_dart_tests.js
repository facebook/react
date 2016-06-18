var Q = require('q');
var glob = require('glob');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var util = require('./util');

module.exports = function(gulp, plugins, config) {
  return function() {
    if (config.dir) {
      return run(config.dir);
    } else {
      return util.forEachSubDirSequential(config.dest, run);
    }
  };

  function run(dir) {
    var testFiles = [].slice.call(glob.sync('**/*.server.spec.dart', {
      cwd: dir
    }));
    if (testFiles.length == 0) {
      // No test files found
      return Q.resolve();
    }

    var defer = Q.defer();
    var done = defer.makeNodeResolver();
    console.log('start tests:', dir);
    var processSerial = function() {
      if (testFiles.length == 0) {
        done();
        return;
      }
      var file = testFiles.shift();
      util.processToPromise(spawn('dart', ['-c', file], {
        stdio: 'inherit',
        cwd: dir
      })).then(
        processSerial,
        function(error) {
          done(error);
        }
      );
    };
    processSerial();
    return defer.promise.then(function() {
      console.log('end tests');
    });
  }
};
