require('es6-shim/es6-shim.js');
require('reflect-metadata');
var testHelper = require('../../src/firefox_extension/lib/test_helper.js');

exports.config = {
  specs: ['spec.js', 'sample_benchmark.js'],

  framework: 'jasmine2',

  jasmineNodeOpts: {showColors: true, defaultTimeoutInterval: 1200000},

  getMultiCapabilities: function() { return testHelper.getFirefoxProfileWithExtension(); }
};
