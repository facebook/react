var grunt = require("grunt");
var wd = require('wd');

module.exports = function(){
  var config = this.data;
  var taskSucceeded = this.async();

  var desiredCapabilities = {};
  if (config.desiredCapabilities) Object.keys(config.desiredCapabilities).forEach(function(key){
    desiredCapabilities[key] = config.desiredCapabilities[key];
  });

  grunt.verbose.write('webdriver remote', JSON.stringify(config.webdriver.remote));
  var browser = wd.promiseChainRemote(config.webdriver.remote);

  browser.on('status', function(info) {
    grunt.verbose.writeln(info);
  });

  browser.on('command', function(meth, path, data) {
    grunt.verbose.writeln(' > ' + meth, path, data || '');
  });

  browser
    .init(desiredCapabilities)
    .get(config.url)
    .then(function(){return browser;})
    .then(getJSReport)
    .then(config.onComplete && config.onComplete.bind(browser), config.onError && config.onError.bind(browser))
    .fail(grunt.verbose.writeln.bind(grunt.verbose))
    .fin(function(){
      if (grunt.option('webdriver-keep-open')) return;
      grunt.verbose.writeln('Closing the browser window. To keep it open, pass the --webdriver-keep-open flag to grunt.');
      return browser.quit();
    })
    .done(
      taskSucceeded.bind(null,true),
      taskSucceeded.bind(null,false)
    )
  ;
}

function getJSReport(browser){
  return browser
    .waitForCondition("typeof window.jasmine != 'undefined'", 500)
    .waitForCondition("typeof window.jasmine.getJSReport != 'undefined'", 10e3)
    .waitForCondition("window.testImageURL.running <= 0", 5e3)
    .eval("jasmine.getJSReport()")
  ;
}
