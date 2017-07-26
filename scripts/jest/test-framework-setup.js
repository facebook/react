'use strict';

if (process.env.REACT_CLASS_EQUIVALENCE_TEST) {
  // Inside the class equivalence tester, we have a custom environment, let's
  // require that instead.
  require('./setupSpecEquivalenceReporter.js');
} else {
  var env = jasmine.getEnv();

  var callCount = 0;
  var oldError = console.error;
  var newError = function() {
    callCount++;
    oldError.apply(this, arguments);
  };

  console.error = newError;

  // TODO: Stop using spyOn in all the test since that seem deprecated.
  // This is a legacy upgrade path strategy from:
  // https://github.com/facebook/jest/blob/v20.0.4/packages/jest-matchers/src/spyMatchers.js#L160
  const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

  env.beforeEach(() => {
    callCount = 0;
    jasmine.addMatchers({
      toBeReset() {
        return {
          compare(actual) {
            // TODO: Catch test cases that call spyOn() but don't inspect the mock
            // properly.
            if (actual !== newError && !isSpy(actual)) {
              return {
                pass: false,
                message: () =>
                  'Test did not tear down console.error mock properly.',
              };
            }
            return {pass: true};
          },
        };
      },
      toNotHaveBeenCalled() {
        return {
          compare(actual) {
            return {
              pass: callCount === 0,
              message: () =>
                'Expected test not to warn. If the warning is expected, mock ' +
                "it out using spyOn(console, 'error'); and test that the " +
                'warning occurs.',
            };
          },
        };
      },
    });
  });
  env.afterEach(() => {
    expect(console.error).toBeReset();
    expect(console.error).toNotHaveBeenCalled();
  });

  var wrapDevMatcher = function(obj, name) {
    const original = obj[name];
    obj[name] = function devMatcher() {
      try {
        original.apply(this, arguments);
      } catch (e) {
        global.__hadDevFailures = e.stack;
      }
    };
  };

  const expectDev = function expectDev(actual) {
    const expectation = expect(actual);
    if (global.__suppressDevFailures) {
      Object.keys(expectation).forEach(name => {
        wrapDevMatcher(expectation, name);
        wrapDevMatcher(expectation.not, name);
      });
    }
    return expectation;
  };
  global.expectDev = expectDev;
}
