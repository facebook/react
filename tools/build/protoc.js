var which = require('which');
var spawnSync = require('child_process').spawnSync;

module.exports.detect = function() {
  var PROTOC = false;
  try {
    var bin = 'protoc';
    which.sync(bin);
    var version = spawnSync(bin, ['--version']).stdout.toString().replace(/\n/g, '');
    PROTOC = {
      bin: bin,
      version: version
    };
  } catch (e) {
    // Ignore, just return `false` instead of an object.
  }
  return PROTOC;
};
