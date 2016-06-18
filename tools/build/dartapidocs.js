var Q = require('q');
var readline = require('readline');
var spawn = require('child_process').spawn;
var util = require('./util');

module.exports = function(gulp, plugins, config) {
  config.output = config.output || 'doc/api';
  return util.forEachSubDirSequential(config.dest, function(dir) {
    var defer = Q.defer();
    var done = defer.makeNodeResolver();

    var supportedModules = [
      'dist/dart/angular2',
      'dist/dart/benchpress'
    ];

    if (supportedModules.indexOf(dir) === -1) {
      done();
    } else {
      console.log('INFO: running dartdoc for ', dir);

      var stream = spawn(config.command, ['--output=' + config.output],
                         {stdio: [process.stdin, process.stdout, process.stderr], cwd: dir});

      stream.on('exit', function(code) {
        if (code !== 0) {
          done('ERROR: dartdoc exited with non-zero status ' + code);
        } else {
          done();
        }
      });

      stream.on('error', function(e) { done('ERROR: dartdoc reported error: ' + e); });
    }
    return defer.promise;
  });
};
