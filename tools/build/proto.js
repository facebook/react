var fs = require('fs');
var glob = require('glob');
var hashFiles = require('hash-files');
var path = require('path');
var protocDetect = require('./protoc').detect;
var spawn = require('child_process').spawn;

// Hashs all .proto files at `config.dir`, calling `computedCallback` on each
// when done with the original file name and its hash.
// When all files have been hashed, calls `completeCallback` with no parameters.
function _hashProtosTask(config, computedCallback, completeCallback) {
  var files = glob.sync(path.join(config.dir, '*.proto'));
  var toUpdate = {};
  var checkComplete = function() {
    for (var key in toUpdate) {
      if (toUpdate.hasOwnProperty(key) && toUpdate[key]) {
        return false;
      }
    }
    return true;
  };
  files.forEach(function(file) { toUpdate[file] = true; });
  files.forEach(
      function(file) {
        hashFiles({
          algorithm: config.algorithm || 'sha1',
          files: [file]
        }, function(error, hash) {
          computedCallback(file, hash);
          toUpdate[file] = false;
          if (checkComplete()) {
            completeCallback();
          }
        });
      });
}

function _toPbDartExtension(path) {
  return path.replace(/\.proto$/, '.pb.dart');
}

module.exports = {
  // Generates `.pb.dart` files from all `.proto` files located at `config.dir`.
  // This task requires the Dart protoc plugin, which is expected to reside at
  // the path specified in `config.plugin`.
  generate: function(config, done) {
    // Note that while the Dart protoc plugin requires the Dart sdk, this task will be skipped if the
    // Dart sdk is not available.
    var protoc = protocDetect();
    if (!protoc) {
      done(new Error('Could not detect protoc - failed to rebuild Dart proto code.'));
      return;
    }

    var protoPaths = glob.sync(path.join(config.dir, '*.proto'));
    var spawnArgs = [
        '--plugin', config.plugin,
        '--proto_path', config.dir,
        '--dart_out', config.dir,
    ].concat(protoPaths);
    var proc = spawn(protoc.bin, spawnArgs, {
      cwd: '.',
      stdio: ['ignore', 2, 'inherit']
    });
    var failed = false;
    var failWithError = function(msg) {
      if (failed) return;
      failed = true;
      done(new Error('Failed while generating transformer boilerplate. Check for output above.\n' +
                     'Message: ' + msg + '\n' +
                     'Please run manually: ' + [protoc.bin].concat(spawnArgs).join(' ')));
    };
    proc.on('error', function(err) { failWithError(String(err)); });
    proc.on('exit', function(code, signal) {
      if (!code) {
        var protocHash = hashFiles.sync({
          algorithm: config.algorithm || 'sha1',
          files: [config.plugin]
        });
        var computedCallback = function(fileName, hash) {
          var pbDartPath = _toPbDartExtension(fileName);
          var toAppend = '/**\n' +
                         ' * Generated with:\n' +
                         ' * ' + path.basename(fileName) + ' (' + hash + ')\n' +
                         ' * ' + protoc.version + '\n' +
                         ' * dart-protoc-plugin (' + protocHash + ')\n' +
                         ' */\n';
          fs.appendFileSync(pbDartPath, toAppend);
        };
        return _hashProtosTask(config, computedCallback, function() { done(); });
      } else {
        failWithError('Exit code was ' + code);
      }
    });
  },

  // Checks that the `.pb.dart` files located at `config.dir` are in sync with
  // the `proto` files at the same directory.
  // It does this by computing the hash of the `.proto` files and looking for
  // that string in the contents of the associated `.pb.dart` file. If one or
  // more file(s) do not have that hash present, this task will fail with a
  // descriptive error message.
  lint: function(config, done) {
    var missing = [];
    var computedCallback = function(filePath, hash) {
      var pbDartPath = _toPbDartExtension(filePath);
      if (String(fs.readFileSync(pbDartPath)).indexOf(hash) < 0) {
        missing.push('  ' + hash  + ' not found in ' + pbDartPath + '\n');
      }
    };
    var completeCallback = function() {
      if (missing.length == 0) {
        done();
      } else {
        done(new Error(
            'Generated Dart protobuf files are out of date. Please run `gulp gen_protos.dart`.\n' +
            missing.join(''))
        );
      }
    };
    return _hashProtosTask(config, computedCallback, completeCallback);
  }
};
