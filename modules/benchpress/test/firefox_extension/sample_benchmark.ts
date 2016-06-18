var benchpress = require('../../index.js');
var runner = new benchpress.Runner([
  // use protractor as Webdriver client
  benchpress.SeleniumWebDriverAdapter.PROTRACTOR_BINDINGS,
  // use RegressionSlopeValidator to validate samples
  benchpress.Validator.bindTo(benchpress.RegressionSlopeValidator),
  // use 10 samples to calculate slope regression
  benchpress.bind(benchpress.RegressionSlopeValidator.SAMPLE_SIZE).toValue(20),
  // use the script metric to calculate slope regression
  benchpress.bind(benchpress.RegressionSlopeValidator.METRIC).toValue('scriptTime'),
  benchpress.bind(benchpress.Options.FORCE_GC).toValue(true)
]);

describe('deep tree baseline', function() {
  it('should be fast!', function(done) {
    browser.ignoreSynchronization = true;
    browser.get('http://localhost:8001/playground/src/benchpress/');

    /*
     * Tell benchpress to click the buttons to destroy and re-create the tree for each sample.
     * Benchpress will log the collected metrics after each sample is collected, and will stop
     * sampling as soon as the calculated regression slope for last 20 samples is stable.
     */
    runner.sample({
            id: 'baseline',
            execute: function() { $('button')
                                      .click(); },
            providers: [benchpress.bind(benchpress.Options.SAMPLE_DESCRIPTION).toValue({depth: 9})]
          })
        .then(done, done.fail);
  });
});
