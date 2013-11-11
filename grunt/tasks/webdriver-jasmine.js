var grunt = require("grunt");
var wd = require('wd');

module.exports = function(){
  var config = this.data;
  var taskSucceeded = this.async();

  var desiredCapabilities = {};
  if (config.desiredCapabilities) Object.keys(config.desiredCapabilities).forEach(function(key){
    if (config.desiredCapabilities[key] === undefined) return;
    desiredCapabilities[key] = config.desiredCapabilities[key];
  });
  grunt.verbose.writeln("desiredCapabilities", JSON.stringify(desiredCapabilities));

  grunt.verbose.writeln('webdriver remote', JSON.stringify(config.webdriver.remote));
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
    .then(function(){return browser;})
    .then(getJSReport)
    .then(function(data){ results = data; })
    .fail(function(error){
      grunt.log.error(error);
      return browser
        .eval('document.documentElement.innerText || document.documentElement.textContent')
        .then(grunt.verbose.writeln.bind(grunt.verbose))
        .then(function(){throw error})
      ;
    })
    .finally(function(){
      if (grunt.option('webdriver-keep-open')) return;
      grunt.verbose.writeln('Closing the browser window. To keep it open, pass the --webdriver-keep-open flag to grunt.');
      return browser.quit();
    })
    .done(
      function(){
        if (config.onComplete) config.onComplete(results);
        taskSucceeded(true);
      },
      function(error){
        if (config.onError) config.onError(error);
        taskSucceeded(false);
      }
    )
  ;
}

function getJSReport(browser){
  return browser
    .waitForCondition("typeof window.jasmine != 'undefined'", 500)
    .fail(function(error){
      throw Error("The test page didn't load properly. " + error);
    })
    .waitForCondition("typeof window.jasmine.getJSReport != 'undefined'", 10e3)
    .waitForCondition("window.postDataToURL.running <= 0", 30e3)
    .eval("jasmine.getJSReport().passed")
  ;
}
