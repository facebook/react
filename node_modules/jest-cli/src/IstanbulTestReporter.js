'use strict';

var DefaultTestReporter = require('./DefaultTestReporter');
var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var reporter = new istanbul.Reporter();

function IstanbulTestReporter(customProcess) {
  this.process = customProcess || process;
}

IstanbulTestReporter.prototype = new DefaultTestReporter();

IstanbulTestReporter.prototype.onTestResult =
function(config, testResult, aggregatedResults) {
  DefaultTestReporter.prototype.onTestResult.call(
    this, config, testResult, aggregatedResults
  );

  if (config.collectCoverage && testResult.coverage) {
    collector.add(testResult.coverage);
  }
};

IstanbulTestReporter.prototype.onRunComplete =
function (config, aggregatedResults) {
  DefaultTestReporter.prototype.onRunComplete.call(
    this, config, aggregatedResults
  );

  if (config.collectCoverage) {
    reporter.addAll([ 'json', 'text', 'lcov', 'clover' ]);
    reporter.write(collector, true, function () {
        console.log('All reports generated');
    });
  }
};

module.exports = IstanbulTestReporter;
