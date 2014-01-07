/* jshint evil: true */

'use strict';

var grunt = require('grunt');

module.exports = function(){
  return require('./webdriver-all').call(this, function(config, wd, browser){
    if (!config.isDoneTimeout) {
      grunt.verbose.writeln('Expected isDoneTimeout config, using default value');
    }
    grunt.verbose.writeln('isDoneTimeout:' + config.isDoneTimeout);
    return browser
      .waitFor(wd.asserters.jsCondition("window.isDone === false"), 5e3, 50)
      .fail(function(error){
        throw Error("The test page didn't load properly. " + error);
      })
      .waitFor(wd.asserters.jsCondition("window.isDone === true"), config.isDoneTimeout || 30e3, 1e3)
      .waitFor(wd.asserters.jsCondition("window.postDataToURL.running <= 0"), 30e3, 500)
      .eval("window.completedTestKeys || window._unhandledError")
    ;
  });
};
