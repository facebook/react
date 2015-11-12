'use strict';

var env = jasmine.getEnv();

var oldError = console.error;
var newError = function() {
  oldError.apply(this, arguments);
  var spec = env.currentSpec;
  if (spec) {
    var expectationResult = new jasmine.ExpectationResult({
      passed: false,
      message:
        'Expected test not to warn. If the warning is expected, mock it ' +
        'out using spyOn(console, \'error\'); and test that the warning ' +
        'occurs.',
    });
    spec.addMatcherResult(expectationResult);
  }
};
console.error = newError;

// Make sure console.error is set back at the end of each test, or else the
// above logic won't work
afterEach(function() {
  // TODO: Catch test cases that call spyOn() but don't inspect the mock
  // properly.

  if (console.error !== newError && !console.error.isSpy) {
    var expectationResult = new jasmine.ExpectationResult({
      passed: false,
      message: 'Test did not tear down console.error mock properly.',
    });
    env.currentSpec.addMatcherResult(expectationResult);
  }
});
