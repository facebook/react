var grunt = require("grunt");
var wd = require('wd');

module.exports = function(){
  var taskSucceeded = this.async();
  var browser = wd.promiseChainRemote(this.data.webdriver.remote);

  browser.on('status', function(info) {
    grunt.verbose.writeln(info);
  });

  browser.on('command', function(meth, path, data) {
    grunt.verbose.writeln(' > ' + meth, path, data || '');
  });

  browser
    .init(this.data.browser)
    .get(this.data.url)
    .then(function(){return browser;})
    .then(getJSReport)
    .then(this.data.onComplete && this.data.onComplete.bind(browser), this.data.onError && this.data.onError.bind(browser))
    .fin(browser.quit.bind(browser))
    .done(taskSucceeded.bind(null,true), taskSucceeded.bind(null,false))
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
