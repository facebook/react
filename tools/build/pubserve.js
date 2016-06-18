var util = require('./util');
var spawn = require('child_process').spawn;

module.exports = function(gulp, plugins, config) {
  return function() {
    config.port = config.port || 8080;
    var pubMode = config.mode || 'debug';
    var pubArgs = ['serve', '--mode', pubMode, '--port', config.port];
    return util.streamToPromise(spawn(config.command, pubArgs, {
      // pub serve is very spammy, and --verbosity flag doesn't fix it
      cwd: config.path, stdio: 'inherit'
    }));
  };
};
