'use strict';

module.exports = function() {
  return require('./webdriver-all').call(this, function(config, wd, browser) {
    var jsCondition = wd.asserters.jsCondition;
    return browser
      .waitFor(
        jsCondition('typeof window.jasmine != \'undefined\''),
        5e3,
        50
      )
      .fail(function(error) {
        throw Error('The test page didn\'t load properly. ' + error);
      })
      .waitFor(
        jsCondition('typeof window.jasmine.getJSReport != \'undefined\''),
        60e3,
        100
      )
      .waitFor(
        jsCondition('window.postDataToURL.running <= 0'),
        30e3,
        500
      )
      .eval('jasmine.getJSReport().passed');
  });
};
