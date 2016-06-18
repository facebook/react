var util = require('./util');
var Q = require('q');
var spawn = require('child_process').spawn;
var readline = require('readline');

module.exports = function(gulp, plugins, config) {
  return function() {
    return isInstalled().then(function(installed) {
      if (!installed) {
        return util.processToPromise(spawn(config.pub,
          ['global', 'activate', config.packageName, '--no-executables'], {
          stdio: 'inherit'
        }));
      }
    }).then(function() {
      return util.processToPromise(spawn(config.pub, ['global', 'run'].concat(config.args), {
        stdio: 'inherit'
      }));
    });
  };

  function isInstalled() {
    var subProcess = spawn(config.pub, ['global', 'list'], {
      // inherit stdin and stderr, but filter stdout
      stdio: [process.stdin, 'pipe', process.stderr]
    });
    var rl = readline.createInterface({
      input: subProcess.stdout,
      output: process.stdout,
      terminal: false
    });
    var found = false;
    rl.on('line', function(line) {
      if (line.indexOf(config.packageName) !== -1) {
        found = true;
      }
      console.log(line);
    });
    return util.processToPromise(subProcess).then( function() {
      return found;
    });
  }

};
