/*eslint-disable consistent-return*/
'use strict';

var grunt = require('grunt');
var wd = require('wd');

module.exports = function task(getJSReport) {
  var config = this.data;
  var taskSucceeded = this.async();
  getJSReport = getJSReport.bind(this, config, wd);

  var desiredCapabilities = {};
  if (config.desiredCapabilities) {
    Object.keys(config.desiredCapabilities).forEach(function(key) {
      if (config.desiredCapabilities[key] === undefined) {
        return;
      }
      desiredCapabilities[key] = config.desiredCapabilities[key];
    });
  }
  grunt.verbose.writeln('desiredCapabilities', JSON.stringify(desiredCapabilities));

  var browser = wd.promiseChainRemote(config.webdriver.remote);

  browser.on('status', function(info) {
    grunt.verbose.writeln(info);
  });

  browser.on('command', function(meth, path, data) {
    grunt.verbose.writeln(' > ' + meth, path, data || '');
  });

  var results = null;

  // browser._debugPromise();
  browser
    .init(desiredCapabilities)
    .then(config.onStart && config.onStart.bind(config, browser))
    .get(config.url)
    .then(function() {
      return browser;
    })
    .then(getJSReport)
    .then(function(data) {
      results = data;
      if (desiredCapabilities.build) {
        var sessionId = browser.getSessionId();
        var user = config.webdriver.remote.user;
        var pwd = config.webdriver.remote.pwd;
        var url = 'curl -X PUT -s -d \'{"passed": ' + (results ? 'true' : 'false') + '}\' -u ' + user + ':' + pwd + ' https://saucelabs.com/rest/v1/' + user + '/jobs/' + sessionId;
        return new Promise(function(resolve){
          require('child_process').exec(url, function (error, stdout, stderr) {
            grunt.verbose.writeln(' > ' + JSON.stringify(desiredCapabilities));
            grunt.verbose.writeln(' > SAUCE Labs status report stdout: ' + stdout);
            if (stderr) {
              grunt.verbose.writeln(' > SAUCE Labs status report stderr: ' + stderr);
            }
            if (error !== null) {
              grunt.verbose.writeln(' > SAUCE Labs status report exec error: ' + error);
            }
            resolve();
          });
        });
      }
    })
    .fail(function(error) {
      grunt.log.error(error);
      return browser
        .eval('document.documentElement.innerText || document.documentElement.textContent')
        .then(grunt.verbose.writeln.bind(grunt.verbose))
        .then(function() {
          throw error;
        });
    })
    .finally(function() {
      if (grunt.option('webdriver-keep-open')) {
        return;
      }
      grunt.verbose.writeln('Closing the browser window. To keep it open, pass the --webdriver-keep-open flag to grunt.');
      return browser.quit();
    })
    .done(
    function() {
      if (config.onComplete) {
        config.onComplete(results);
      }
      taskSucceeded(true);
    },
    function(error) {
      if (config.onError) {
        config.onError(error);
      }
      taskSucceeded(false);
    }
  );
};