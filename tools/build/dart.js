var which = require('which');
var spawnSync = require('child_process').spawnSync;

module.exports.detect = function(gulp) {
  var DART_SDK = false;
  try {
    which.sync('dart');
    if (process.platform === 'win32') {
      DART_SDK = {
        ANALYZER: 'dartanalyzer.bat',
        DARTDOCGEN: 'dartdoc.bat',
        DARTFMT: 'dartfmt.bat',
        PUB: 'pub.bat',
        VM: 'dart.exe'
      };
    } else {
      DART_SDK = {
        ANALYZER: 'dartanalyzer',
        DARTDOCGEN: 'dartdoc',
        DARTFMT: 'dartfmt',
        PUB: 'pub',
        VM: 'dart'
      };
    }
    console.log('Dart SDK detected:');
  } catch (e) {
    console.log('Dart SDK is not available, Dart tasks will be skipped.');
    var gulpTaskFn = gulp.task.bind(gulp);
    gulp.task = function (name, deps, fn) {
      if (name.indexOf('.dart') === -1) {
        return gulpTaskFn(name, deps, fn);
      } else {
        return gulpTaskFn(name, function() {
          console.log('Dart SDK is not available. Skipping task: ' + name);
        });
      }
    };
  }
  return DART_SDK;
}

module.exports.logVersion = function(dartSdk) {
  console.log('DART SDK:') ;
  console.log('- dart: ' + spawnSync(dartSdk.VM, ['--version']).stderr.toString().replace(/\n/g, ''));
  console.log('- pub: ' + spawnSync(dartSdk.PUB, ['--version']).stdout.toString().replace(/\n/g, ''));
}
